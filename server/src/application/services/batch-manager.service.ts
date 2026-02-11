import { InventoryBatchRepository, InventoryLogRepository } from '../../domain/repositories/inventory.repository.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { ValidationError } from '../../shared/errors/app.errors.js'
import { AuditService } from './audit.service.js'

export class BatchManager {
  constructor(
    private productRepo: ProductRepository,
    private logRepo: InventoryLogRepository,
    private inventoryBatchRepo: InventoryBatchRepository,
    private auditService: AuditService
  ) {}

  async createBatch(data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const items = data.products || []
    if (!data.code || items.length === 0) {
      throw new ValidationError('Datos del lote incompletos')
    }

    const batch = await this.inventoryBatchRepo.create({
      code: data.code,
      providerId: data.providerId || null,
      notes: data.notes || null,
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: Number(item.quantity) || 0,
          soldQuantity: Number(item.soldQuantity) || 0,
          unitCostUSD: Number(item.unitCostUSD) || 0,
          unitSaleUSD: Number(item.unitSaleUSD) || 0,
          entryDate: new Date(item.entryDate),
          discounted: !!item.discounted,
          discountPercent: Number(item.discountPercent) || 0,
        }))
      }
    })

    // Log the batch creation in audit system
    await this.auditService.logAction({
      entityType: 'INVENTORY_BATCH',
      entityId: batch.id,
      action: 'CREATE',
      userId,
      details: { code: data.code, itemCount: items.length },
      ipAddress,
      userAgent
    })

    for (const item of items) {
      const product = await this.productRepo.findById(item.productId)
      if (!product) continue
      
      const previousStock = product.stock
      const quantity = Number(item.quantity) || 0
      const newStock = previousStock + quantity
      const purchasePrice = Number(item.unitCostUSD) || 0
      const salePrice = Number(item.unitSaleUSD) || 0

      await this.productRepo.update(item.productId, {
        stock: newStock,
        inStock: newStock > 0,
        purchasePrice,
        price: salePrice,
        profitMargin: purchasePrice > 0 ? salePrice / purchasePrice : 1.5,
      })

      await this.logRepo.create({
        productId: item.productId,
        changeType: 'BATCH_ENTRY',
        previousStock,
        newStock,
        changeAmount: quantity,
        reason: `Lote ${data.code}`,
      })
      
      // Audit log for each product update in the batch
      await this.auditService.logAction({
        entityType: 'PRODUCT',
        entityId: item.productId,
        action: 'UPDATE_STOCK',
        userId,
        details: { 
          reason: 'BATCH_ENTRY', 
          batchCode: data.code, 
          added: quantity, 
          newStock 
        },
        ipAddress,
        userAgent
      })
    }

    return batch
  }
}
