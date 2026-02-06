import { ValidationError } from '../../shared/errors/app.errors.js'
import { SettingsRepository } from '../../domain/repositories/settings.repository.js'

export interface UpdateSettingInput {
  key: string
  value: string
  reason?: string
}

export class SettingsService {
  constructor(private settingsRepo: SettingsRepository) {}

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
  async updateSettings(updates: UpdateSettingInput[], userId: string) {
    try {
      return await this.settingsRepo.updateManyWithHistory(updates, userId)
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
