import { ValidationError, AuthenticationError } from '../../shared/errors/app.errors.js'
import { SettingsRepository } from '../../domain/repositories/settings.repository.js'
import { AuditService } from './audit.service.js'
import { BackupService } from './backup.service.js'
import { UserRepository } from '../../domain/repositories/user.repository.js'
import bcrypt from 'bcryptjs'

export interface UpdateSettingInput {
  key: string
  value: string
  reason?: string
}

export class SettingsService {
  constructor(
    private settingsRepo: SettingsRepository,
    private auditService: AuditService,
    private backupService: BackupService,
    private userRepo: UserRepository
  ) {}

  /**
   * Verifica la contraseña especial del administrador
   */
  async verifyAdminPassword(userId: string, password: string) {
    const user = await this.userRepo.findById(userId)
    if (!user || user.role !== 'ADMIN' || !user.passwordHash) {
      throw new AuthenticationError('Acceso denegado')
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      throw new AuthenticationError('Contraseña de administrador incorrecta')
    }

    return true
  }

  /**
   * Crea un respaldo de la base de datos
   */
  async createBackup(userId: string) {
    const backup = await this.backupService.createBackup()
    
    if (backup) {
      await this.auditService.logAction({
        entityType: 'SETTINGS',
        action: 'BACKUP_CREATE',
        userId,
        details: { filename: backup.filename }
      })
    }

    return backup
  }

  /**
   * Lista los respaldos disponibles
   */
  async listBackups(userId: string) {
    return await this.backupService.listBackups()
  }

  /**
   * Lista los respaldos remotos (Google Drive)
   */
  async listRemoteBackups() {
    const { googleDriveBackupService } = await import('../../shared/container.js')
    return await googleDriveBackupService.listRemoteBackups()
  }

  /**
   * Restaura un respaldo de la base de datos
   * Requiere un mensaje de confirmación escrito por el usuario
   */
  async restoreBackup(userId: string, filename: string, confirmationMessage?: string) {
    console.log(`[SettingsService] restoreBackup called: filename=${filename}, confirmationMessage=${confirmationMessage}`)
    
    // Validar mensaje de confirmación
    const expectedMessage = `RESTAURAR ${filename}`
    if (confirmationMessage?.trim().toUpperCase() !== expectedMessage) {
      console.log(`[SettingsService] Invalid confirmation. Expected: ${expectedMessage}, Got: ${confirmationMessage}`)
      throw new ValidationError(`Para confirmar escribe exactamente: "${expectedMessage}"`)
    }

    console.log(`[SettingsService] Confirmation valid, proceeding with restore...`)
    const result = await this.backupService.restoreBackup(filename)
    
    await this.auditService.logAction({
      entityType: 'SETTINGS',
      action: 'BACKUP_RESTORE',
      userId,
      details: { 
        restoredFrom: filename,
        autoBackupCreated: result.autoBackupFilename,
        confirmedBy: confirmationMessage
      }
    })

    return { 
      message: 'Base de datos restaurada con éxito',
      autoBackupFilename: result.autoBackupFilename,
      restoredFrom: result.restoredFrom
    }
  }

  /**
   * Elimina un respaldo
   */
  async deleteBackup(userId: string, filename: string, confirmationMessage?: string) {
    // Validar mensaje de confirmación
    const expectedMessage = `ELIMINAR ${filename}`
    if (confirmationMessage?.trim().toUpperCase() !== expectedMessage) {
      throw new ValidationError(`Para confirmar escribe exactamente: "${expectedMessage}"`)
    }

    await this.backupService.deleteBackup(filename)
    
    await this.auditService.logAction({
      entityType: 'SETTINGS',
      action: 'BACKUP_DELETE',
      userId,
      details: { filename, confirmedBy: confirmationMessage }
    })

    return { message: 'Respaldo eliminado con éxito' }
  }

  /**
   * Obtiene todas las configuraciones agrupadas
   */
  async getAllSettings() {
    const settings = await this.settingsRepo.findAll()

    return settings.reduce((acc, curr) => {
      const group = curr.group || 'general'
      if (!acc[group]) acc[group] = []
      acc[group].push(curr)
      return acc
    }, {} as Record<string, typeof settings>)
  }

  /**
   * Obtiene configuraciones públicas para el frontend
   */
  async getPublicSettings() {
    const settings = await this.settingsRepo.findPublic()

    return settings.reduce((acc, curr) => {
      acc[curr.key] = this.parseValue(curr.value, curr.type)
      return acc
    }, {} as Record<string, any>)
  }

  /**
   * Actualiza múltiples configuraciones con auditoría
   */
  async updateSettings(updates: UpdateSettingInput[], userId: string, ipAddress?: string, userAgent?: string) {
    try {
      const result = await this.settingsRepo.updateManyWithHistory(updates, userId)
      
      // GDPR Compliant Audit
      await this.auditService.logAction({
        entityType: 'SETTINGS',
        action: 'UPDATE',
        userId,
        details: { updates: updates.map(u => ({ key: u.key, value: u.value })) },
        ipAddress,
        userAgent
      })

      return result
    } catch (error: any) {
      throw new ValidationError(error.message)
    }
  }

  /**
   * Obtiene el historial de una configuración
   */
  async getHistory(key: string) {
    const history = await this.settingsRepo.getHistory(key)

    if (!history) {
      throw new ValidationError(`Configuración no encontrada: ${key}`)
    }

    return history
  }

  /**
   * Revierte una configuración a un valor anterior
   */
  async revertSetting(historyId: string, userId: string) {
    const historyEntry = await this.settingsRepo.findHistoryById(historyId)

    if (!historyEntry) {
      throw new ValidationError('Entrada de historial no encontrada')
    }

    return await this.updateSettings([{
      key: historyEntry.setting.key,
      value: historyEntry.oldValue,
      reason: `Reversión al valor del ${historyEntry.createdAt.toLocaleDateString()}`
    }], userId)
  }

  /**
   * Utilidad para parsear valores según su tipo
   */
  private parseValue(value: string, type: string) {
    switch (type) {
      case 'number': return Number(value)
      case 'boolean': return value === 'true'
      case 'json': 
        try { return JSON.parse(value) } catch { return value }
      default: return value
    }
  }
}
