import { NotificationRepository, BatchRepository } from '../../domain/repositories/business.repository.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'

export class NotificationService {
  constructor(
    private notificationRepo: NotificationRepository,
    private productRepo: ProductRepository,
    private batchRepo: BatchRepository
  ) {}

  async createNotification(data: {
    type: 'LOW_STOCK' | 'EXPIRATION' | 'SYSTEM' | 'SALE'
    title: string
    message: string
  }) {
    return this.notificationRepo.create(data)
  }

  async getUnreadNotifications() {
    return this.notificationRepo.findUnread()
  }

  async markAsRead(id: string) {
    return this.notificationRepo.update(id, { isRead: true })
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
