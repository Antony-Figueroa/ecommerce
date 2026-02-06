import { NotificationRepository, BatchRepository } from '../../domain/repositories/business.repository.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'

export class NotificationService {
  constructor(
    private notificationRepo: NotificationRepository,
    private productRepo: ProductRepository,
    private batchRepo: BatchRepository
  ) {}

  async createNotification(data: {
    type: 'LOW_STOCK' | 'EXPIRATION' | 'SYSTEM' | 'SALE' | 'SALE_STATUS'
    title: string
    message: string
    userId?: string
  }) {
    return this.notificationRepo.create(data)
  }

  async getUnreadNotifications(userId?: string) {
    return this.notificationRepo.findUnread(userId)
  }

  async getAllNotifications(userId?: string, limit?: number, skip?: number) {
    return this.notificationRepo.findAll(userId, limit, skip)
  }

  async countNotifications(userId?: string) {
    return this.notificationRepo.count(userId)
  }

  async markAsRead(id: string) {
    return this.notificationRepo.update(id, { isRead: true })
  }

  async markAllAsRead(userId?: string) {
    return this.notificationRepo.markAllAsRead(userId)
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
