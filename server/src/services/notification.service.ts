import { prisma } from '../lib/prisma.js'

export class NotificationService {
  static async createNotification(data: {
    type: 'LOW_STOCK' | 'EXPIRATION' | 'SYSTEM'
    title: string
    message: string
  }) {
    return prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
      },
    })
  }

  static async getUnreadNotifications() {
    return prisma.notification.findMany({
      where: { isRead: false },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })
  }

  static async checkLowStock() {
    const products = await prisma.product.findMany({
      where: {
        stock: { lte: prisma.product.fields.minStock },
        isActive: true,
      },
    })

    for (const product of products) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'LOW_STOCK',
          message: { contains: product.sku },
          isRead: false,
        },
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

  static async checkExpirations() {
    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    const nearExpiryBatches = await prisma.batch.findMany({
      where: {
        expirationDate: {
          lte: thirtyDaysFromNow,
          gt: today,
        },
        stock: { gt: 0 },
      },
      include: { product: true },
    })

    for (const batch of nearExpiryBatches) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'EXPIRATION',
          message: { contains: batch.batchNumber },
          isRead: false,
        },
      })

      if (!existingNotification) {
        await this.createNotification({
          type: 'EXPIRATION',
          title: 'Producto próximo a vencer',
          message: `El lote ${batch.batchNumber} del producto ${batch.product.name} vence el ${batch.expirationDate.toLocaleDateString()}.`,
        })
      }
    }
  }
}
