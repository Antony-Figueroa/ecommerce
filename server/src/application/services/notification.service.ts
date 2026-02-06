import { NotificationRepository, BatchRepository, NotificationSettingRepository } from '../../domain/repositories/business.repository.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { socketService } from '../../infrastructure/socket.service.js'

export class NotificationService {
  constructor(
    private notificationRepo: NotificationRepository,
    private productRepo: ProductRepository,
    private batchRepo: BatchRepository,
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
  }) {
    // Si hay un usuario, verificar si tiene silenciada esta categoría
    if (data.userId && this.settingRepo && data.category) {
      const settings = await this.settingRepo.findByUserId(data.userId)
      if (settings) {
        const categoryKey = data.category.toLowerCase() as keyof typeof settings
        // @ts-ignore
        if (settings[categoryKey] === false) {
          // Si está silenciada, no creamos la notificación (o podríamos crearla pero no emitirla)
          // Para este caso, la crearemos para el historial pero no la emitiremos por socket
          const notification = await this.notificationRepo.create(data)
          return notification
        }
      }
    }

    const notification = await this.notificationRepo.create(data)
    
    if (data.userId) {
      socketService.emitToUser(data.userId, 'notification', notification)
    } else {
      socketService.emitToAdmin('notification', notification)
    }

    return notification
  }

  async getUnreadNotifications(userId?: string) {
    return this.notificationRepo.findUnread(userId)
  }

  async getAllNotifications(userId?: string, category?: string, limit?: number, skip?: number) {
    return this.notificationRepo.findAll({ userId, category, limit, skip })
  }

  async countNotifications(userId?: string, category?: string) {
    return this.notificationRepo.count(userId, category)
  }

  async markAsRead(id: string) {
    return this.notificationRepo.update(id, { isRead: true })
  }

  async markAllAsRead(userId?: string, category?: string) {
    return this.notificationRepo.markAllAsRead(userId, category)
  }

  async deleteNotification(id: string) {
    return this.notificationRepo.delete(id)
  }

  async checkLowStock() {
    const products = await this.productRepo.findLowStock()

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
      }
    }
  }

  async checkExpirations() {
    const nearExpiryBatches = await this.batchRepo.findNearExpiry(30)

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
      }
    }
  }
}
