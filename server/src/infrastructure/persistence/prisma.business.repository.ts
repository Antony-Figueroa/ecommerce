import { prisma } from './prisma.client.js'
import { 
  SaleRepository, 
  RequirementRepository, 
  NotificationRepository, 
  BatchRepository,
  PaymentRepository,
  InstallmentRepository,
  PaymentProofRepository,
  BusinessEventRepository
} from '../../domain/repositories/business.repository.js'

export class PrismaSaleRepository implements SaleRepository {
  async create(data: any, tx?: any) {
    const client = tx || prisma
    return client.sale.create({
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
      },
    })
  }

  async findByConfirmationToken(token: string) {
    return prisma.sale.findUnique({
      where: { confirmationToken: token },
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
      },
    })
  }

  async findAll(options: any) {
    const { include, select, ...rest } = options || {}
    
    // Prisma does not allow both select and include
    if (select) {
      return prisma.sale.findMany({
        ...rest,
        select
      })
    }

    return prisma.sale.findMany({
      ...rest,
      include: { 
        user: true, 
        items: true,
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

  async update(id: string, data: any, tx?: any) {
    const client = tx || prisma
    return client.sale.update({
      where: { id },
      data,
      include: { items: true },
    })
  }

  async updateItem(itemId: string, data: any, tx?: any) {
    const client = tx || prisma
    return client.saleItem.update({
      where: { id: itemId },
      data,
    })
  }

  async findDuplicate(data: any) {
    const { customerPhone, totalUSD, minutesAgo } = data
    const timeThreshold = new Date(Date.now() - minutesAgo * 60 * 1000)

    return prisma.sale.findFirst({
      where: {
        customerPhone,
        totalUSD: { equals: totalUSD },
        createdAt: { gte: timeThreshold },
        status: { not: 'CANCELLED' }
      }
    })
  }
}

export class PrismaPaymentRepository implements PaymentRepository {
  async create(data: any, tx?: any) {
    const client = tx || prisma
    return client.payment.create({ data })
  }

  async findById(id: string) {
    return prisma.payment.findUnique({ where: { id } })
  }

  async findBySaleId(saleId: string) {
    return prisma.payment.findMany({
      where: { saleId },
      orderBy: { paidAt: 'desc' }
    })
  }
}

export class PrismaInstallmentRepository implements InstallmentRepository {
  async create(data: any, tx?: any) {
    const client = tx || prisma
    return client.installment.create({ data })
  }

  async createMany(data: any[], tx?: any) {
    const client = tx || prisma
    return client.installment.createMany({ data })
  }

  async findById(id: string) {
    return prisma.installment.findUnique({ 
      where: { id },
      include: { proofs: true }
    })
  }

  async findBySaleId(saleId: string) {
    return prisma.installment.findMany({
      where: { saleId },
      include: { proofs: true },
      orderBy: { dueDate: 'asc' }
    })
  }

  async update(id: string, data: any, tx?: any) {
    const client = tx || prisma
    return client.installment.update({
      where: { id },
      data
    })
  }

  async findOverdue(date: Date) {
    return prisma.installment.findMany({
      where: {
        dueDate: { lt: date },
        status: { in: ['PENDING', 'PARTIAL'] }
      },
      include: { sale: true }
    })
  }
}

export class PrismaPaymentProofRepository implements PaymentProofRepository {
  async create(data: any, tx?: any) {
    const client = tx || prisma
    return client.paymentProof.create({ data })
  }

  async findById(id: string) {
    return prisma.paymentProof.findUnique({
      where: { id },
      include: { installment: true }
    })
  }

  async findByInstallmentId(installmentId: string) {
    return prisma.paymentProof.findMany({
      where: { installmentId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findByStatus(status: string) {
    return prisma.paymentProof.findMany({
      where: { status },
      include: { installment: { include: { sale: true } } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async update(id: string, data: any, tx?: any) {
    const client = tx || prisma
    return client.paymentProof.update({
      where: { id },
      data
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
  }, tx?: any) {
    const client = tx || prisma
    return client.notification.create({
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

export class PrismaBusinessEventRepository implements BusinessEventRepository {
  async create(data: {
    type: string
    title: string
    description?: string
    date: Date
    amount?: number
    status?: string
    isFuture?: boolean
    userId?: string
  }) {
    return prisma.businessEvent.create({
      data: {
        ...data,
        userId: data.userId || null
      }
    })
  }

  async findAll(options: {
    startDate?: Date
    endDate?: Date
    type?: string
    userId?: string
    isFuture?: boolean
  }) {
    const { startDate, endDate, type, userId, isFuture } = options
    const where: any = {}

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = startDate
      if (endDate) where.date.lte = endDate
    }

    if (type) where.type = type
    if (userId) where.userId = userId
    if (isFuture !== undefined) where.isFuture = isFuture

    return prisma.businessEvent.findMany({
      where,
      orderBy: { date: 'asc' },
      include: { user: true }
    })
  }

  async findById(id: string) {
    return prisma.businessEvent.findUnique({
      where: { id },
      include: { user: true }
    })
  }

  async update(id: string, data: any) {
    return prisma.businessEvent.update({
      where: { id },
      data
    })
  }

  async delete(id: string) {
    await prisma.businessEvent.delete({
      where: { id }
    })
  }

  async findPendingAlerts(date: Date) {
    return prisma.businessEvent.findMany({
      where: {
        isFuture: true,
        alertSent: false,
        date: {
          lte: date
        }
      }
    })
  }

  async markAlertSent(id: string) {
    await prisma.businessEvent.update({
      where: { id },
      data: { alertSent: true }
    })
  }
}
