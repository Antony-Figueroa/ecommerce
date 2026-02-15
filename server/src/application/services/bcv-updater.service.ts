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
      let source = 'auto-ve-dolarapi-bcv'

      try {
        // 2. Consultar API (DolarApi.com - BCV Oficial) con timeout de 10 segundos
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = (await response.json()) as { promedio?: number; price?: number; official?: number; price_old?: number }
        console.log('Datos recibidos de DolarApi (BCV Oficial):', data)
        
        const rateValue = data.official || data.price || data.promedio || data.price_old
        newRate = rateValue ?? null
        
        console.log('Valor BCV Oficial procesado:', newRate)
      } catch (apiError: any) {
        const errorDetail = apiError instanceof Error ? apiError.message : String(apiError)
        console.error('Error consultando DolarApi BCV:', errorDetail)
        
        // 1. Intentar usar la tasa previa de la BD (último registro obtenido de la API exitosamente)
        if (previousRate > 0) {
          newRate = previousRate
          source = 'auto-fallback-db'
          console.log(`API falló (${errorDetail}). Usando última tasa conocida de la BD como respaldo: ${newRate}`)
          
          // Notificar advertencia para que el administrador sepa que la API falló pero el sistema continúa
          await this.notificationService.createNotification({
            type: 'SYSTEM',
            title: 'Advertencia Actualización BCV',
            message: `La API de DolarApi falló (${errorDetail}). Se está utilizando el último monto registrado en la base de datos (${newRate} Bs) como respaldo.`
          })
        } else {
          // 2. Mecanismo de respaldo final: Tasa fija desde configuración
          const fallbackSetting = await this.settingsRepo.findByKey('FIXED_BCV_RATE')
          
          if (fallbackSetting && fallbackSetting.value) {
            newRate = parseFloat(fallbackSetting.value)
            source = 'auto-fallback-fixed'
            console.log(`API falló y no hay historial. Usando tasa de respaldo fija configurada: ${newRate}`)
          } else {
            throw new Error('La API falló, no hay historial en la BD y no hay una tasa de respaldo fija configurada')
          }
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
