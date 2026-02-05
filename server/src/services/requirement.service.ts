import { prisma } from '../lib/prisma.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

function generateRequirementCode(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `REQ-${year}${month}-${random}`
}

export class RequirementService {
  static async createRequirement(data: {
    supplier: string
    items: Array<{
      productId: string
      name: string
      quantity: number
      unitCost: number
      batchNumber?: string
      expirationDate?: string | Date
    }>
    notes?: string
  }) {
    const itemsWithTotals = data.items.map(item => ({
      ...item,
      total: item.quantity * item.unitCost,
      expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
    }))

    const subtotalUSD = itemsWithTotals.reduce((sum, item) => sum + item.total, 0)
    const totalUSD = subtotalUSD

    let code = generateRequirementCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.requirement.findUnique({ where: { code } })
      if (!existing) break
      code = generateRequirementCode()
      attempts++
    }

    const requirement = await prisma.requirement.create({
      data: {
        code,
        supplier: data.supplier,
        notes: data.notes,
        subtotalUSD,
        totalUSD,
        items: {
          create: itemsWithTotals.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.total,
            batchNumber: item.batchNumber,
            expirationDate: item.expirationDate,
          })),
        },
      },
      include: { items: true },
    })

    return requirement
  }

  static async getRequirementById(id: string) {
    const requirement = await prisma.requirement.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!requirement) {
      throw new NotFoundError('Requerimiento')
    }
    return requirement
  }

  static async getAllRequirements(options?: {
    status?: string
    supplier?: string
    page?: number
    limit?: number
  }) {
    const { status = null, supplier = null, page = 1, limit = 20 } = options || {}

    const where: any = {}
    if (status) where.status = status
    if (supplier) where.supplier = { contains: supplier }

    const [requirements, total] = await Promise.all([
      prisma.requirement.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.requirement.count({ where }),
    ])

    return {
      requirements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  static async updateRequirementStatus(id: string, status: string) {
    const requirement = await prisma.requirement.findUnique({ where: { id } })
    if (!requirement) {
      throw new NotFoundError('Requerimiento')
    }

    const validStatuses = ['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Estado inválido')
    }

    const updated = await prisma.requirement.update({
      where: { id },
      data: { status },
      include: { items: true },
    })

    if (status === 'RECEIVED') {
      for (const item of updated.items as any[]) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } })
        if (product) {
          const previousStock = product.stock
          const newStock = previousStock + item.quantity

          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: newStock,
              inStock: newStock > 0,
            },
          })

          // Create or update batch
          if (item.batchNumber && item.expirationDate) {
            await (prisma as any).batch.create({
              data: {
                productId: item.productId,
                batchNumber: item.batchNumber,
                expirationDate: item.expirationDate,
                stock: item.quantity,
              },
            })
          }

          await prisma.inventoryLog.create({
            data: {
              productId: item.productId,
              changeType: 'RESTOCK',
              previousStock,
              newStock,
              changeAmount: item.quantity,
              reason: `Requerimiento ${updated.code} recibido`,
            },
          })
        }
      }
    }

    return updated
  }

  static async deleteRequirement(id: string) {
    const requirement = await prisma.requirement.findUnique({ where: { id } })
    if (!requirement) {
      throw new NotFoundError('Requerimiento')
    }

    if (requirement.status !== 'PENDING') {
      throw new ValidationError('Solo se pueden eliminar requerimientos en estado PENDIENTE')
    }

    await prisma.requirement.delete({ where: { id } })
    return { success: true }
  }

  static async receiveRequirement(id: string) {
    return this.updateRequirementStatus(id, 'RECEIVED')
  }

  static async cancelRequirement(id: string) {
    return this.updateRequirementStatus(id, 'CANCELLED')
  }

  static async getRequirementsSummary() {
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
      totalInvestedUSD: Number(totalUSD._sum.totalUSD || 0),
    }
  }
}
