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
    this.dbPath = path.join(__dirname, '../../../prisma/dev.db');
    this.backupDir = path.join(__dirname, '../../../../backups');
  }

  /**
   * Crea un respaldo de la base de datos SQLite
   */
  async createBackup() {
    try {
      console.log(`[${new Date().toISOString()}] Iniciando respaldo de base de datos...`);

      // Asegurar que la carpeta de respaldos existe
      await fs.mkdir(this.backupDir, { recursive: true });

      // Generar nombre de archivo con fecha y hora
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '')
        .replace('T', '_');
      
      const backupFilename = `db_backup_${timestamp}.db`;
      const destination = path.join(this.backupDir, backupFilename);

      // Copiar el archivo
      await fs.copyFile(this.dbPath, destination);

      console.log(`✅ Respaldo creado exitosamente: ${backupFilename}`);
      
      // Opcional: Limpiar respaldos antiguos (mantener los últimos 30 días)
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
   */
  async restoreBackup(filename: string) {
    try {
      const source = path.join(this.backupDir, filename);
      
      // Verificar si el archivo existe
      await fs.access(source);

      console.log(`[${new Date().toISOString()}] Iniciando restauración de base de datos: ${filename}`);

      // Crear un respaldo temporal de la DB actual antes de restaurar
      const tempBackup = `${this.dbPath}.tmp`;
      await fs.copyFile(this.dbPath, tempBackup);

      try {
        // Restaurar la DB
        await fs.copyFile(source, this.dbPath);
        
        // Eliminar el respaldo temporal si todo salió bien
        await fs.unlink(tempBackup);
        
        console.log(`✅ Restauración completada exitosamente: ${filename}`);
        return true;
      } catch (restoreError) {
        // Si falla la restauración, intentar recuperar la DB original
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
}
