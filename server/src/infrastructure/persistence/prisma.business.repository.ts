import { prisma } from './prisma.client.js'
import { SaleRepository, RequirementRepository, NotificationRepository, BatchRepository } from '../../domain/repositories/business.repository.js'

export class PrismaSaleRepository implements SaleRepository {
  async create(data: any) {
    return prisma.sale.create({
      data,
      include: { items: true, user: true },
    })
  }

  async findById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: { 
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' }
                }
              }
            }
          }
        }, 
        user: true, 
        auditLogs: { orderBy: { createdAt: 'desc' } } 
      },
    })
  }

  async findBySaleNumber(saleNumber: string) {
    return prisma.sale.findUnique({
      where: { saleNumber },
      include: { 
        items: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { sortOrder: 'asc' }
                }
              }
            }
          }
        }, 
        user: true, 
        auditLogs: { orderBy: { createdAt: 'desc' } } 
      },
    })
  }

  async findAll(options: any) {
    const { include, ...rest } = options || {}
    return prisma.sale.findMany({
      ...rest,
      include: { 
        user: true, 
        items: true,
        auditLogs: { take: 1, orderBy: { createdAt: 'desc' } },
        ...include
      },
    })
  }

  async count(where: any) {
    return prisma.sale.count({ where })
  }

  async getSummary(options: any) {
    const { startDate, endDate } = options
    const where: any = {}
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { items: true },
    })

    return sales
  }

  async getStats(options: any) {
    // Implementación de estadísticas agregadas si es necesario
    return {}
  }

  async update(id: string, data: any) {
    return prisma.sale.update({
      where: { id },
      data,
      include: { items: true, auditLogs: true },
    })
  }

  async updateItem(itemId: string, data: any) {
    return prisma.saleItem.update({
      where: { id: itemId },
      data,
    })
  }

  async createAuditLog(data: any) {
    return prisma.saleAuditLog.create({
      data,
    })
  }

  async findDuplicate(data: { customerPhone: string; totalUSD: number; minutesAgo: number }) {
    const { customerPhone, totalUSD, minutesAgo } = data
    const dateLimit = new Date(Date.now() - minutesAgo * 60 * 1000)

    return prisma.sale.findFirst({
      where: {
        customerPhone,
        totalUSD,
        createdAt: {
          gte: dateLimit,
        },
        status: {
          not: 'CANCELLED',
        },
      },
    })
  }
}

export class PrismaNotificationRepository implements NotificationRepository {
  async create(data: { 
    type: string; 
    priority?: string;
    category?: string;
    title: string; 
    message: string; 
    userId?: string;
    link?: string;
    metadata?: string;
  }) {
    return prisma.notification.create({
      data: {
        type: data.type,
        priority: data.priority || 'NORMAL',
        category: data.category || 'SYSTEM',
        title: data.title,
        message: data.message,
        userId: data.userId || null,
        link: data.link,
        metadata: data.metadata,
      },
    })
  }

  async findUnread(userId?: string) {
    return prisma.notification.findMany({
      where: { 
        isRead: false,
        userId: userId || null // null for admin
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findAll(options: { 
    userId?: string; 
    category?: string;
    limit?: number; 
    skip?: number;
  }) {
    const { userId, category, limit = 20, skip = 0 } = options
    return prisma.notification.findMany({
      where: { 
        userId: userId || null,
        category: category || undefined
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip
    })
  }

  async count(userId?: string, category?: string) {
    return prisma.notification.count({
      where: {
        userId: userId || null,
        category: category || undefined
      }
    })
  }

  async update(id: string, data: any) {
    return prisma.notification.update({
      where: { id },
      data,
    })
  }

  async findFirst(where: any) {
    return prisma.notification.findFirst({ where })
  }

  async markAllAsRead(userId?: string, category?: string) {
    await prisma.notification.updateMany({
      where: { 
        userId: userId || null,
        category: category || undefined,
        isRead: false 
      },
      data: { isRead: true }
    })
  }

  async delete(id: string) {
    await prisma.notification.delete({
      where: { id }
    })
  }
}

export class PrismaRequirementRepository implements RequirementRepository {
  async create(data: any) {
    return prisma.requirement.create({ data })
  }

  async findById(id: string) {
    return prisma.requirement.findUnique({
      where: { id },
      include: { items: true }
    })
  }

  async findByCode(code: string) {
    return prisma.requirement.findUnique({
      where: { code },
      include: { items: true }
    })
  }

  async findAll(options: any) {
    return prisma.requirement.findMany({
      ...options,
      orderBy: { createdAt: 'desc' },
    })
  }

  async count(where: any) {
    return prisma.requirement.count({ where })
  }

  async update(id: string, data: any) {
    return prisma.requirement.update({ where: { id }, data })
  }

  async delete(id: string) {
    await prisma.requirement.delete({ where: { id } })
  }

  async getSummary() {
    const [pending, approved, ordered, received, cancelled] = await Promise.all([
      prisma.requirement.count({ where: { status: 'PENDING' } }),
      prisma.requirement.count({ where: { status: 'APPROVED' } }),
      prisma.requirement.count({ where: { status: 'ORDERED' } }),
      prisma.requirement.count({ where: { status: 'RECEIVED' } }),
      prisma.requirement.count({ where: { status: 'CANCELLED' } }),
    ])

    const totalUSD = await prisma.requirement.aggregate({
      _sum: { totalUSD: true },
      where: { status: { not: 'CANCELLED' } },
    })

    return {
      counts: { pending, approved, ordered, received, cancelled },
      totalUSD: Number(totalUSD._sum.totalUSD || 0),
    }
  }

  async groupBy(options: any) {
    return (prisma.requirement as any).groupBy(options)
  }

  async aggregate(options: any) {
    return (prisma.requirement as any).aggregate(options)
  }
}

export class PrismaBatchRepository implements BatchRepository {
  async findMany(options: any) {
    return prisma.batch.findMany(options)
  }

  async findNearExpiry(days: number) {
    const today = new Date()
    const targetDate = new Date()
    targetDate.setDate(today.getDate() + days)

    return prisma.batch.findMany({
      where: {
        expirationDate: {
          lte: targetDate,
          gt: today,
        },
        stock: { gt: 0 },
      },
      include: { product: true },
    })
  }

  async update(id: string, data: any) {
    return prisma.batch.update({
      where: { id },
      data,
    })
  }

  async create(data: any) {
    return prisma.batch.create({ data })
  }
}
