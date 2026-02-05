import { prisma } from '../lib/prisma.js'
import { ValidationError } from '../utils/errors.js'

export interface UpdateSettingInput {
  key: string
  value: string
  reason?: string
}

export class SettingsService {
  /**
   * Obtiene todas las configuraciones agrupadas
   */
  static async getAllSettings() {
    const settings = await prisma.setting.findMany({
      orderBy: [
        { group: 'asc' },
        { label: 'asc' }
      ]
    })

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
  static async getPublicSettings() {
    const settings = await prisma.setting.findMany({
      where: { isPublic: true },
      select: {
        key: true,
        value: true,
        type: true
      }
    })

    return settings.reduce((acc, curr) => {
      acc[curr.key] = this.parseValue(curr.value, curr.type)
      return acc
    }, {} as Record<string, any>)
  }

  /**
   * Actualiza múltiples configuraciones con auditoría
   */
  static async updateSettings(updates: UpdateSettingInput[], userId: string) {
    return await prisma.$transaction(async (tx) => {
      const results = []

      for (const update of updates) {
        const setting = await tx.setting.findUnique({
          where: { key: update.key }
        })

        if (!setting) {
          throw new ValidationError(`Configuración no encontrada: ${update.key}`)
        }

        // Si el valor no ha cambiado, saltar
        if (setting.value === String(update.value)) continue

        // Guardar en el historial
        await tx.settingHistory.create({
          data: {
            settingId: setting.id,
            oldValue: setting.value,
            newValue: String(update.value),
            userId,
            reason: update.reason || 'Actualización manual'
          }
        })

        // Actualizar el valor
        const updated = await tx.setting.update({
          where: { id: setting.id },
          data: { value: String(update.value) }
        })

        results.push(updated)
      }

      return results
    })
  }

  /**
   * Obtiene el historial de una configuración
   */
  static async getHistory(key: string) {
    const setting = await prisma.setting.findUnique({
      where: { key },
      include: {
        history: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!setting) {
      throw new ValidationError(`Configuración no encontrada: ${key}`)
    }

    return setting.history
  }

  /**
   * Revierte una configuración a un valor anterior
   */
  static async revertSetting(historyId: string, userId: string) {
    const historyEntry = await prisma.settingHistory.findUnique({
      where: { id: historyId },
      include: { setting: true }
    })

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
  private static parseValue(value: string, type: string) {
    switch (type) {
      case 'number': return Number(value)
      case 'boolean': return value === 'true'
      case 'json': 
        try { return JSON.parse(value) } catch { return value }
      default: return value
    }
  }
}
