import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class BackupService {
  private dbPath: string;
  private backupDir: string;

  constructor() {
    // La base de datos está en server/prisma/dev.db
    // Este archivo está en server/src/application/services/backup.service.ts
    // En entornos de desarrollo con Prisma, el nombre por defecto suele ser dev.db
    this.dbPath = process.env.DATABASE_URL 
      ? path.resolve(process.env.DATABASE_URL.replace('file:', ''))
      : path.join(__dirname, '../../../prisma/dev.db');
    this.backupDir = path.join(__dirname, '../../../../backups');
  }

  /**
   * Verifica si la base de datos existe antes de intentar respaldar
   */
  private async ensureDbExists() {
    try {
      await fs.access(this.dbPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Crea un respaldo de la base de datos SQLite
   */
  async createBackup() {
    try {
      console.log(`[${new Date().toISOString()}] Iniciando respaldo de base de datos...`);

      if (!(await this.ensureDbExists())) {
        console.warn(`⚠️ Omitiendo respaldo: Base de datos no encontrada en ${this.dbPath}`);
        return null;
      }

      await fs.mkdir(this.backupDir, { recursive: true });

      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '')
        .replace('T', '_');
      
      const backupFilename = `db_backup_${timestamp}.db`;
      const destination = path.join(this.backupDir, backupFilename);

      await fs.copyFile(this.dbPath, destination);

      console.log(`✅ Respaldo creado exitosamente: ${backupFilename}`);
      
      await this.cleanupOldBackups();
      
      return {
        filename: backupFilename,
        path: destination,
        createdAt: now
      };
    } catch (error) {
      console.error('❌ Error creando respaldo:', error);
      throw error;
    }
  }

  /**
   * Crea respaldo y sincroniza a Google Drive
   */
  async createAndSyncBackup(): Promise<{ success: boolean; filename?: string; message: string }> {
    const result = await this.createBackup()
    
    if (!result) {
      return { success: false, message: 'Error al crear respaldo local' }
    }

    const { googleDriveBackupService } = await import('../../shared/container.js')
    const uploadResult = await googleDriveBackupService.uploadBackup(result.filename)
    
    if (uploadResult.success) {
      return { success: true, filename: result.filename, message: `Respaldo creado y sincronizado a Google Drive` }
    }
    
    return { success: true, filename: result.filename, message: `Respaldo creado (sincronización a Drive pendiente: ${uploadResult.message})` }
  }

  /**
   * Lista todos los respaldos disponibles
   */
  async listBackups() {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      const files = await fs.readdir(this.backupDir);
      
      const backups = await Promise.all(
        files
          .filter(file => file.startsWith('db_backup_') && file.endsWith('.db'))
          .map(async file => {
            const filePath = path.join(this.backupDir, file);
            const stats = await fs.stat(filePath);
            return {
              filename: file,
              size: stats.size,
              createdAt: stats.mtime
            };
          })
      );

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('❌ Error listando respaldos:', error);
      throw error;
    }
  }

  /**
   * Restaura un respaldo específico
   * IMPORTANTE: Crea un respaldo automático de la DB actual antes de restaurar
   */
  async restoreBackup(filename: string) {
    try {
      const source = path.join(this.backupDir, filename);
      
      // Verificar si el archivo existe
      await fs.access(source);

      console.log(`[${new Date().toISOString()}] Iniciando restauración de base de datos: ${filename}`);

      // =====================================================
      // CREAR RESPALDO AUTOMÁTICO ANTES DE RESTAURAR
      // Esto asegura que tenemos un punto de retorno si algo falla
      // =====================================================
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '')
        .replace('T', '_');
      
      const autoBackupFilename = `db_backup_pre_restore_${timestamp}.db`;
      const autoBackupPath = path.join(this.backupDir, autoBackupFilename);
      
      console.log(`📦 Creando respaldo automático de seguridad: ${autoBackupFilename}`);
      await fs.copyFile(this.dbPath, autoBackupPath);
      console.log(`✅ Respaldo de seguridad creado: ${autoBackupFilename}`);

      // =====================================================
      // PROCESO DE RESTAURACIÓN
      // =====================================================
      
      // Crear un respaldo temporal de la DB actual por seguridad adicional
      const tempBackup = `${this.dbPath}.restore_tmp`;
      await fs.copyFile(this.dbPath, tempBackup);

      try {
        // Restaurar la DB desde el respaldo seleccionado
        await fs.copyFile(source, this.dbPath);
        
        // Eliminar el respaldo temporal si todo salió bien
        await fs.unlink(tempBackup);
        
        console.log(`✅ Restauración completada exitosamente: ${filename}`);
        console.log(`💡 Puedes revertir usando el respaldo de seguridad: ${autoBackupFilename}`);
        
        return {
          success: true,
          autoBackupFilename,
          restoredFrom: filename
        };
      } catch (restoreError) {
        // Si falla la restauración, intentar recuperar la DB original
        console.error('⚠️ Error durante la restauración, intentando recuperar...');
        await fs.copyFile(tempBackup, this.dbPath);
        await fs.unlink(tempBackup);
        throw restoreError;
      }
    } catch (error) {
      console.error('❌ Error restaurando respaldo:', error);
      throw error;
    }
  }

  /**
   * Elimina un respaldo específico
   */
  async deleteBackup(filename: string) {
    try {
      const filePath = path.join(this.backupDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando respaldo:', error);
      throw error;
    }
  }

  /**
   * Elimina respaldos de más de 30 días para ahorrar espacio
   */
  private async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const now = Date.now();
      const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 días

      for (const file of files) {
        if (file.startsWith('db_backup_') && file.endsWith('.db')) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtimeMs > MAX_AGE) {
            await fs.unlink(filePath);
            console.log(`Cleanup: Respaldo antiguo eliminado: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error limpiando respaldos antiguos:', error);
    }
  }

  /**
   * Obtiene el respaldo más reciente
   */
  async getLatestBackup() {
    const backups = await this.listBackups();
    return backups.length > 0 ? backups[0] : null;
  }

  /**
   * Restaura automáticamente el respaldo más reciente
   * Útil para mantener sincronizada la base de datos entre máquinas
   */
  async restoreLatestBackup(): Promise<{ success: boolean; filename?: string; message: string }> {
    try {
      const latestBackup = await this.getLatestBackup();
      
      if (!latestBackup) {
        return { success: false, message: 'No hay respaldos disponibles' };
      }

      console.log(`[${new Date().toISOString()}] Restaurando respaldo más reciente: ${latestBackup.filename}`);
      await this.restoreBackup(latestBackup.filename);
      
      return { 
        success: true, 
        filename: latestBackup.filename, 
        message: `Restaurado desde: ${latestBackup.filename}` 
      };
    } catch (error) {
      console.error('❌ Error restaurando respaldo más reciente:', error);
      return { success: false, message: `Error: ${error}` };
    }
  }
}
