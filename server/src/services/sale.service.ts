import { prisma } from '../lib/prisma.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

function generateSaleNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `VTA-${year}${month}${day}-${random}`
}

export class SaleService {
  static async createSale(data: {
    userId?: string
    customerName?: string
    customerPhone?: string
    items: Array<{
      productId: string
      name: string
      quantity: number
      unitPrice: number
    }>
    shippingCost?: number
    bcvRate?: number
    notes?: string
  }) {
    const bcvRate = data.bcvRate || await this.getCurrentBCV()

    const itemsWithTotals = await Promise.all(data.items.map(async item => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) throw new NotFoundError(`Producto ${item.name} no encontrado`)

      const unitCost = Number(product.purchasePrice) + Number(product.shippingCost)
      const profitPerUnit = item.unitPrice - unitCost
      return {
        ...item,
        unitCost,
        total: item.quantity * item.unitPrice,
        profitPerUnit,
        totalProfit: profitPerUnit * item.quantity,
      }
    }))

    const subtotalUSD = itemsWithTotals.reduce((sum, item) => sum + item.total, 0)
    const shippingCostUSD = data.shippingCost || 0
    const totalUSD = subtotalUSD + shippingCostUSD
    const totalBS = totalUSD * bcvRate
    const profitUSD = itemsWithTotals.reduce((sum, item) => sum + item.totalProfit, 0)
    const profitBS = profitUSD * bcvRate

    let saleNumber = generateSaleNumber()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.sale.findUnique({ where: { saleNumber } })
      if (!existing) break
      saleNumber = generateSaleNumber()
      attempts++
    }

    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        userId: data.userId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        notes: data.notes,
        subtotalUSD,
        shippingCostUSD,
        totalUSD,
        bcvRate,
        totalBS,
        profitUSD,
        profitBS,
        items: {
          create: itemsWithTotals.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitCost: item.unitCost,
            unitPrice: item.unitPrice,
            total: item.total,
            profitPerUnit: item.profitPerUnit,
            totalProfit: item.totalProfit,
          })),
        },
      },
      include: { items: true },
    })

    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (product) {
        const previousStock = product.stock
        const newStock = previousStock - item.quantity

        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            inStock: newStock > 0,
          },
        })

        // Discount from batches (FEFO)
        let remainingToDiscount = item.quantity
        const batches = await prisma.batch.findMany({
          where: { productId: item.productId, stock: { gt: 0 } },
          orderBy: { expirationDate: 'asc' },
        })

        for (const batch of batches) {
          if (remainingToDiscount <= 0) break

          const discountFromThisBatch = Math.min(batch.stock, remainingToDiscount)
          await prisma.batch.update({
            where: { id: batch.id },
            data: {
              stock: { decrement: discountFromThisBatch },
            },
          })
          remainingToDiscount -= discountFromThisBatch
        }

        await prisma.inventoryLog.create({
          data: {
            productId: item.productId,
            changeType: 'SALE',
            previousStock,
            newStock,
            changeAmount: -item.quantity,
            reason: `Venta ${saleNumber}`,
          },
        })
      }
    }

    return sale
  }

  static async getSaleById(id: string) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { 
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            }
          }
        } 
      },
    })
    if (!sale) {
      throw new NotFoundError('Venta')
    }
    return sale
  }

  static async getAllSales(options?: {
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) {
    const { status = null, startDate = null, endDate = null, page = 1, limit = 20 } = options || {}

    const where: any = {}
    if (status) where.status = status
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sale.count({ where }),
    ])

    return {
      sales,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    }
  }

  static async getSalesByUserId(userId: string, params: {
    page?: number
    limit?: number
  } = {}) {
    const { page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.sale.count({ where: { userId } }),
    ])

    return {
      sales,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      },
    }
  }

  static async updateSaleStatus(id: string, status: string) {
    const sale = await prisma.sale.findUnique({ where: { id } })
    if (!sale) {
      throw new NotFoundError('Venta')
    }

    const validStatuses = ['PENDING', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Estado inválido')
    }

    return prisma.sale.update({
      where: { id },
      data: { status },
      include: { items: true },
    })
  }

  static async cancelSale(id: string) {
    const sale = await this.getSaleById(id)

    if (sale.status === 'CANCELLED') {
      throw new ValidationError('La venta ya está cancelada')
    }

    for (const item of sale.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      const previousStock = product?.stock || 0
      const newStock = previousStock + item.quantity

      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: newStock,
          inStock: true,
        },
      })

      await prisma.inventoryLog.create({
        data: {
          productId: item.productId,
          changeType: 'CANCELLED_SALE',
          previousStock,
          newStock,
          changeAmount: item.quantity,
          reason: `Venta ${sale.saleNumber} cancelada`,
        },
      })
    }

    return prisma.sale.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: true },
    })
  }

  static async getCurrentBCV(): Promise<number> {
    const latestRate = await prisma.bCVRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return Number(latestRate?.rate || 0)
  }

  static async getSalesSummary(options?: { startDate?: string; endDate?: string }) {
    const { startDate = null, endDate = null } = options || {}

    const where: any = { status: { not: 'CANCELLED' } }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [sales, totals] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.aggregate({
        where,
        _sum: {
          subtotalUSD: true,
          shippingCostUSD: true,
          totalUSD: true,
          totalBS: true,
          profitUSD: true,
          profitBS: true,
        },
      }),
    ])

    const totalItems = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0)
    }, 0)

    const completedSales = sales.filter(s => s.status === 'COMPLETED').length
    const pendingSales = sales.filter(s => s.status === 'PENDING').length

    return {
      totalSales: sales.length,
      completedSales,
      pendingSales,
      totalItems,
      summaryUSD: {
        subtotal: Number(totals._sum.subtotalUSD || 0),
        shipping: Number(totals._sum.shippingCostUSD || 0),
        total: Number(totals._sum.totalUSD || 0),
      },
      summaryBS: {
        total: Number(totals._sum.totalBS || 0),
      },
      profitUSD: Number(totals._sum.profitUSD || 0),
      profitBS: Number(totals._sum.profitBS || 0),
    }
  }

  static async getRecentSales(limit = 10) {
    return prisma.sale.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
