import { NotificationRepository, BatchRepository, NotificationSettingRepository } from '../../domain/repositories/business.repository.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { socketService } from '../../infrastructure/socket.service.js'
import { AuditService } from './audit.service.js'

export class NotificationManager {
  constructor(
    private notificationRepo: NotificationRepository,
    private productRepo: ProductRepository,
    private batchRepo: BatchRepository,
    private auditService: AuditService,
    private settingRepo?: NotificationSettingRepository
  ) {}

  async createNotification(data: {
    type: string
    priority?: string
    category?: string
    title: string
    message: string
    userId?: string
    link?: string
    metadata?: string
  }, silent: boolean = false) {
    // Si hay un usuario, verificar si tiene silenciada esta categoría
    if (data.userId && this.settingRepo && data.category) {
      const settings = await this.settingRepo.findByUserId(data.userId)
      if (settings) {
        const categoryKey = data.category.toLowerCase() as keyof typeof settings
        // @ts-ignore
        if (settings[categoryKey] === false) {
          // Si está silenciada, solo creamos en DB si no es silent
          return this.notificationRepo.create(data)
        }
      }
    }

    const notification = await this.notificationRepo.create(data)
    
    if (!silent) {
      if (data.userId) {
        socketService.emitToUser(data.userId, 'notification', notification)
      } else {
        socketService.emitToAdmin('notification', notification)
      }
    }

    return notification
  }

  async checkLowStock() {
    const products = await this.productRepo.findLowStock()
    let count = 0

    for (const product of products) {
      const existingNotification = await this.notificationRepo.findFirst({
        type: 'LOW_STOCK',
        message: { contains: product.sku },
        isRead: false,
      })

      if (!existingNotification) {
        await this.createNotification({
          type: 'LOW_STOCK',
          title: 'Stock Bajo',
          message: `El producto ${product.name} (SKU: ${product.sku}) tiene un stock de ${product.stock}, el mínimo es ${product.minStock}.`,
        })
        count++
      }
    }
    return count
  }

  async checkExpirations() {
    const nearExpiryBatches = await this.batchRepo.findNearExpiry(30)
    let count = 0

    for (const batch of nearExpiryBatches) {
      const existingNotification = await this.notificationRepo.findFirst({
        type: 'EXPIRATION',
        message: { contains: batch.batchNumber },
        isRead: false,
      })

      if (!existingNotification) {
        await this.createNotification({
          type: 'EXPIRATION',
          title: 'Producto próximo a vencer',
          message: `El lote ${batch.batchNumber} del producto ${batch.product.name} vence el ${new Date(batch.expirationDate).toLocaleDateString()}.`,
        })
        count++
      }
    }
    return count
  }
}
