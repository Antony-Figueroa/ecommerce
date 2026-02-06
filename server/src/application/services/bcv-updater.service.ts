import { BCVRepository, SettingsRepository } from '../../domain/repositories/settings.repository.js'
import { NotificationService } from './notification.service.js'
import { InventoryService } from './inventory.service.js'

export class BCVUpdaterService {
  constructor(
    private bcvRepo: BCVRepository,
    private settingsRepo: SettingsRepository,
    private notificationService: NotificationService,
    private inventoryService: InventoryService
  ) {}

  /**
   * Actualiza la tasa BCV desde la API y ajusta los precios de los productos en bolívares.
   */
  async updateRate() {
    try {
      console.log(`[${new Date().toISOString()}] Iniciando actualización de tasa BCV...`)
      
      // 1. Obtener tasa actual para validación
      const previousRate = await this.bcvRepo.getCurrentRate()
      
      let newRate: number | null = null
      const source = 'auto-ve-dolarapi-bcv'

      try {
        // 2. Consultar API (DolarApi.com - BCV Oficial)
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial')
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status} al obtener tasa BCV`)
        }
        
        const data = (await response.json()) as { promedio?: number; price?: number; official?: number; price_old?: number }
        console.log('Datos recibidos de DolarApi (BCV Oficial):', data)
        
        const rateValue = data.official || data.price || data.promedio || data.price_old
        newRate = rateValue ?? null
        
        console.log('Valor BCV Oficial procesado:', newRate)
      } catch (apiError) {
        console.error('Error consultando DolarApi BCV:', apiError)
        
        // Mecanismo de respaldo final: Tasa fija desde configuración
        const fallbackSetting = await this.settingsRepo.findByKey('FIXED_BCV_RATE')
        
        if (fallbackSetting && fallbackSetting.value) {
          newRate = parseFloat(fallbackSetting.value)
          console.log(`Usando tasa de respaldo fija: ${newRate}`)
        } else {
          throw new Error('La API falló y no hay una tasa de respaldo configurada')
        }
      }

      if (!newRate || typeof newRate !== 'number') {
        throw new Error('No se pudo determinar una tasa válida')
      }

      // 3. Validación de rango
      if (previousRate > 0) {
        const diff = Math.abs(newRate - previousRate) / previousRate
        if (diff > 15.0) {
          const errorMsg = `Validación de rango fallida: La nueva tasa (${newRate}) varía demasiado respecto a la anterior (${previousRate})`
          
          await this.notificationService.createNotification({
            type: 'SYSTEM',
            title: 'Alerta de Tasa BCV',
            message: errorMsg
          })
          
          throw new Error(errorMsg)
        }
      }

      // 4. Actualización de tasa y precios
      // Desactivar tasas anteriores
      await this.bcvRepo.deactivateAll()

      // Crear nueva tasa
      await this.bcvRepo.setRate(newRate!, source)

      // 5. Actualizar precios de productos configurados en BS
      if (previousRate > 0) {
        await this.inventoryService.updatePricesByBCV(newRate!, previousRate)
      }

      console.log(`[${new Date().toISOString()}] Tasa BCV actualizada exitosamente a ${newRate} (${source})`)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error(`[${new Date().toISOString()}] Error en el actualizador BCV:`, message)
      
      await this.notificationService.createNotification({
        type: 'SYSTEM',
        title: 'Error Actualización BCV',
        message: `El sistema de actualización automática falló: ${message}`
      })
    }
  }
}
