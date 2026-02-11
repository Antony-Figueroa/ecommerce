import { NotFoundError, ValidationError } from '../../shared/errors/app.errors.js'
import { RequirementRepository, BatchRepository } from '../../domain/repositories/business.repository.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { InventoryLogRepository } from '../../domain/repositories/inventory.repository.js'
import { AuditService } from './audit.service.js'

function generateRequirementCode(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `REQ-${year}${month}-${random}`
}

export class RequirementService {
  constructor(
    private requirementRepo: RequirementRepository,
    private productRepo: ProductRepository,
    private batchRepo: BatchRepository,
    private logRepo: InventoryLogRepository,
    private auditService: AuditService
  ) {}

  async createRequirement(data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const itemsWithTotals = data.items.map((item: any) => ({
      ...item,
      total: item.quantity * item.unitCost,
      expirationDate: item.expirationDate ? new Date(item.expirationDate) : null,
    }))

    const subtotalUSD = itemsWithTotals.reduce((sum: number, item: any) => sum + item.total, 0)
    const totalUSD = subtotalUSD

    let code = generateRequirementCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await this.requirementRepo.findByCode(code)
      if (!existing) break
      code = generateRequirementCode()
      attempts++
    }

    const requirement = await this.requirementRepo.create({
      code,
      supplier: data.supplier,
      notes: data.notes,
      subtotalUSD,
      totalUSD,
      items: {
        create: itemsWithTotals.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          unitCost: item.unitCost,
          total: item.total,
          batchNumber: item.batchNumber,
          expirationDate: item.expirationDate,
        })),
      },
    })

    await this.auditService.logAction({
      entityType: 'REQUIREMENT',
      entityId: requirement.id,
      action: 'CREATE',
      userId,
      details: { code: requirement.code, totalUSD: requirement.totalUSD },
      ipAddress,
      userAgent
    })

    return requirement
  }

  async getRequirementById(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const requirement = await this.requirementRepo.findById(id)
    if (!requirement) {
      throw new NotFoundError('Requerimiento')
    }

    // Audit log for accessing specific requirement
    await this.auditService.logAction({
      entityType: 'REQUIREMENT',
      entityId: id,
      action: 'VIEW_DETAILS',
      userId,
      details: { code: requirement.code },
      ipAddress,
      userAgent
    })

    return requirement
  }

  async getAllRequirements(options?: any, userId?: string, ipAddress?: string, userAgent?: string) {
    // Audit log for accessing all requirements
    await this.auditService.logAction({
      entityType: 'REPORT',
      action: 'VIEW_ALL_REQUIREMENTS',
      userId,
      details: { options },
      ipAddress,
      userAgent
    })

    const { status = null, supplier = null, page = 1, limit = 20 } = options || {}

    const where: any = {}
    if (status) where.status = status
    if (supplier) where.supplier = { contains: supplier }

    const [requirements, total] = await Promise.all([
      this.requirementRepo.findAll({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.requirementRepo.count(where),
    ])

    return {
      requirements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async updateRequirementStatus(id: string, status: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const requirement = await this.requirementRepo.findById(id)
    if (!requirement) {
      throw new NotFoundError('Requerimiento')
    }

    const validStatuses = ['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Estado inválido')
    }

    const updated = await this.requirementRepo.update(id, { status })

    // Audit status change
    await this.auditService.logAction({
      entityType: 'REQUIREMENT',
      entityId: id,
      action: 'UPDATE_STATUS',
      userId,
      details: { oldStatus: requirement.status, newStatus: status },
      ipAddress,
      userAgent
    })

    if (status === 'RECEIVED') {
      const fullRequirement = await this.requirementRepo.findById(id)
      
      for (const item of fullRequirement?.items || []) {
        const product = await this.productRepo.findById(item.productId)
        if (product) {
          const previousStock = product.stock
          const newStock = previousStock + item.quantity

          await this.productRepo.update(item.productId, {
            stock: newStock,
            inStock: newStock > 0,
          })

          if (item.batchNumber && item.expirationDate) {
            await this.batchRepo.create({
              productId: item.productId,
              batchNumber: item.batchNumber,
              expirationDate: item.expirationDate,
              stock: item.quantity,
            })
          }

          await this.logRepo.create({
            productId: item.productId,
            changeType: 'RESTOCK',
            previousStock,
            newStock,
            changeAmount: item.quantity,
            reason: `Requerimiento ${fullRequirement?.code} recibido`,
          })
        }
      }
    }

    return updated
  }

  async deleteRequirement(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const requirement = await this.requirementRepo.findById(id)
    if (!requirement) {
      throw new NotFoundError('Requerimiento')
    }

    if (requirement.status !== 'PENDING') {
      throw new ValidationError('Solo se pueden eliminar requerimientos en estado PENDIENTE')
    }

    await this.requirementRepo.delete(id)

    // Audit deletion
    await this.auditService.logAction({
      entityType: 'REQUIREMENT',
      entityId: id,
      action: 'DELETE',
      userId,
      details: { code: requirement.code },
      ipAddress,
      userAgent
    })

    return { success: true }
  }

  async receiveRequirement(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    return this.updateRequirementStatus(id, 'RECEIVED', userId, ipAddress, userAgent)
  }

  async cancelRequirement(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    return this.updateRequirementStatus(id, 'CANCELLED', userId, ipAddress, userAgent)
  }

  async getRequirementsSummary(userId?: string, ipAddress?: string, userAgent?: string) {
    // Audit log for accessing requirements summary
    await this.auditService.logAction({
      entityType: 'REPORT',
      action: 'VIEW_REQUIREMENTS_SUMMARY',
      userId,
      ipAddress,
      userAgent
    })
    return this.requirementRepo.getSummary()
  }
}
