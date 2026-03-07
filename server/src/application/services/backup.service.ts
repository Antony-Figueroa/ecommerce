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
          .filter(file => file.endsWith('.db'))
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
   * NOTA: En producción (PostgreSQL), la restauración desde archivos no es posible
   */
  async restoreBackup(filename: string) {
    const isProduction = process.env.NODE_ENV === 'production'
    
    if (isProduction) {
      throw new Error('La restauración de respaldos no está disponible en producción con PostgreSQL. Los datos se sincronizan automáticamente desde Google Drive.')
    }
    
    try {
      const source = path.join(this.backupDir, filename);
      
      await fs.access(source);

      console.log(`[${new Date().toISOString()}] Iniciando restauración: ${filename}`);

      await fs.copyFile(source, this.dbPath);
      
      console.log(`✅ Restauración completada: ${filename}`);
      
      return {
        success: true,
        restoredFrom: filename
      };
    } catch (error) {
      console.error('❌ Error restaurando respaldo:', error);
      throw error;
    }
  }

  /**
   * Restaura selectivamente solo las tablas de productos, inventario y ventas
   * Mantiene intactas las tablas de usuarios y administradores
   * NOTA: Esta función no está disponible en PostgreSQL (producción)
   */
  private async selectiveRestore(sourceDbPath: string, targetDbPath: string) {
    console.warn('⚠️ Restauración selectiva de SQLite no disponible en PostgreSQL');
    throw new Error('La restauración selectiva de respaldos SQLite no está disponible en producción con PostgreSQL');
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
