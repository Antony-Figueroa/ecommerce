import { prisma } from '../lib/prisma.js'
import { BCVService } from './bcv.service.js'
import { NotificationService } from './notification.service.js'
import { InventoryService } from './inventory.service.js'

export class BCVUpdaterService {
  /**
   * Actualiza la tasa BCV desde la API y ajusta los precios de los productos en bolívares.
   */
  static async updateRate() {
    try {
      console.log(`[${new Date().toISOString()}] Iniciando actualización de tasa BCV...`)
      
      // 1. Obtener tasa actual para validación
      const previousRate = await BCVService.getCurrentRate()
      
      let newRate: number | null = null
      const source = 'auto-ve-dolarapi-bcv'

      try {
        // 2. Consultar API (DolarApi.com - BCV Oficial)
        // Se utiliza la tasa oficial del BCV (aprox 378.46 BS/USD) según requerimiento
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial')
        if (!response.ok) {
          throw new Error(`Error HTTP ${response.status} al obtener tasa BCV`)
        }
        
        const data = (await response.json()) as { promedio?: number; price?: number; official?: number; price_old?: number }
        console.log('Datos recibidos de DolarApi (BCV Oficial):', data)
        
        // Extraer el valor exacto de la API oficial sin escalados manuales
        // DolarApi en /v1/dolares/oficial devuelve el valor exacto del BCV
        // Priorizamos 'official' si existe, luego 'price', luego 'promedio'
        const rateValue = data.official || data.price || data.promedio || data.price_old
        newRate = rateValue ?? null
        
        console.log('Valor BCV Oficial procesado:', newRate)
      } catch (apiError) {
        console.error('Error consultando DolarApi BCV:', apiError)
        
        // Mecanismo de respaldo final: Tasa fija desde configuración
        const fallbackSetting = await prisma.setting.findUnique({
          where: { key: 'FIXED_BCV_RATE' }
        })
        
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

      // 3. Validación de rango (Aumentamos el rango de validación para permitir cambios bruscos si son necesarios)
      if (previousRate > 0) {
        const diff = Math.abs(newRate - previousRate) / previousRate
        // Permitir variaciones de hasta 1500% (esto es para desarrollo o cambios de escala)
        if (diff > 15.0) {
          const errorMsg = `Validación de rango fallida: La nueva tasa (${newRate}) varía demasiado respecto a la anterior (${previousRate})`
          
          await NotificationService.createNotification({
            type: 'SYSTEM',
            title: 'Alerta de Tasa BCV',
            message: errorMsg
          })
          
          throw new Error(errorMsg)
        }
      }

      // 4. Actualización atómica de tasa y precios
      await prisma.$transaction(async (tx) => {
        // Desactivar tasas anteriores
        await tx.bCVRate.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        })

        // Crear nueva tasa
        await tx.bCVRate.create({
          data: {
            rate: newRate!,
            source,
            isActive: true,
          },
        })

        // 5. Actualizar precios de productos configurados en BS
        if (previousRate > 0) {
          await InventoryService.updatePricesByBCV(newRate!, previousRate)
        }
      })

      console.log(`[${new Date().toISOString()}] Tasa BCV actualizada exitosamente a ${newRate} (${source})`)
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      console.error(`[${new Date().toISOString()}] Error en el actualizador BCV:`, message)
      
      await NotificationService.createNotification({
        type: 'SYSTEM',
        title: 'Error Actualización BCV',
        message: `El sistema de actualización automática falló: ${message}`
      })
    }
  }
}
