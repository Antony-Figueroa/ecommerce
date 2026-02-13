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

  async deleteBatch(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const batch = await this.inventoryBatchRepo.findById(id)
    if (!batch) {
      throw new ValidationError('Lote no encontrado')
    }

    // Validación: No se puede eliminar si algún item ha sido vendido
    const hasSales = batch.items?.some((item: any) => item.soldQuantity > 0)
    if (hasSales) {
      throw new ValidationError('No se puede eliminar un lote que ya tiene ventas registradas')
    }

    // Revertir el stock en los productos antes de eliminar
    for (const item of batch.items || []) {
      const product = await this.productRepo.findById(item.productId)
      if (product) {
        const previousStock = product.stock
        const quantityToRemove = Number(item.quantity) || 0
        const newStock = Math.max(0, previousStock - quantityToRemove)
        
        await this.productRepo.update(item.productId, {
          stock: newStock,
          inStock: newStock > 0
        })

        await this.logRepo.create({
          productId: item.productId,
          changeType: 'BATCH_REMOVAL',
          previousStock,
          newStock,
          changeAmount: -quantityToRemove,
          reason: `Eliminación de lote ${batch.code}`,
        })
      }
    }

    await this.inventoryBatchRepo.delete(id)

    await this.auditService.logAction({
      entityType: 'INVENTORY_BATCH',
      entityId: id,
      action: 'DELETE',
      userId,
      details: { code: batch.code },
      ipAddress,
      userAgent
    })

    return { success: true }
  }

  async updateBatch(id: string, data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const batch = await this.inventoryBatchRepo.findById(id)
    if (!batch) {
      throw new ValidationError('Lote no encontrado')
    }

    const hasSales = batch.items?.some((item: any) => item.soldQuantity > 0)
    
    // Si hay ventas, solo permitimos proveedor y notas
    if (hasSales && data.products) {
      throw new ValidationError('No se pueden editar los productos de un lote con ventas registradas.')
    }

    const updateData: any = {
      providerId: data.providerId || batch.providerId,
      notes: data.notes !== undefined ? data.notes : batch.notes,
    }

    // Si no hay ventas y vienen productos, permitimos la edición completa de items
    if (!hasSales && data.products) {
      // 1. Revertir el stock actual antes de actualizar
      for (const oldItem of batch.items || []) {
        const product = await this.productRepo.findById(oldItem.productId)
        if (product) {
          const previousStock = product.stock
          const quantityToRemove = Number(oldItem.quantity) || 0
          const newStock = Math.max(0, previousStock - quantityToRemove)
          
          await this.productRepo.update(oldItem.productId, {
            stock: newStock,
            inStock: newStock > 0
          })

          await this.logRepo.create({
            productId: oldItem.productId,
            changeType: 'BATCH_ADJUSTMENT_REVERT',
            previousStock,
            newStock,
            changeAmount: -quantityToRemove,
            reason: `Reajuste de lote ${batch.code}`,
          })
        }
      }

      // 2. Preparar los nuevos items para la actualización de Prisma
      updateData.items = {
        deleteMany: {}, // Borrar todos los items actuales
        create: data.products.map((item: any) => ({
          productId: item.productId,
          quantity: Number(item.quantity) || 0,
          soldQuantity: 0,
          unitCostUSD: Number(item.unitCostUSD) || 0,
          unitSaleUSD: Number(item.unitSaleUSD) || 0,
          entryDate: new Date(item.entryDate),
          discounted: !!item.discounted,
          discountPercent: Number(item.discountPercent) || 0,
        }))
      }
    }

    const updated = await this.inventoryBatchRepo.update(id, updateData)

    // 3. Si se actualizaron los items, aplicar el nuevo stock
    if (!hasSales && data.products) {
      for (const newItem of data.products) {
        const product = await this.productRepo.findById(newItem.productId)
        if (product) {
          const previousStock = product.stock
          const quantityToAdd = Number(newItem.quantity) || 0
          const newStock = previousStock + quantityToAdd
          const purchasePrice = Number(newItem.unitCostUSD) || 0
          const salePrice = Number(newItem.unitSaleUSD) || 0

          await this.productRepo.update(newItem.productId, {
            stock: newStock,
            inStock: newStock > 0,
            purchasePrice,
            price: salePrice,
            profitMargin: purchasePrice > 0 ? salePrice / purchasePrice : 1.5,
          })

          await this.logRepo.create({
            productId: newItem.productId,
            changeType: 'BATCH_ADJUSTMENT_APPLY',
            previousStock,
            newStock,
            changeAmount: quantityToAdd,
            reason: `Reajuste de lote ${batch.code}`,
          })
        }
      }
    }

    await this.auditService.logAction({
      entityType: 'INVENTORY_BATCH',
      entityId: id,
      action: 'UPDATE',
      userId,
      details: { 
        code: batch.code, 
        updatedFields: Object.keys(data),
        itemsUpdated: !!(!hasSales && data.products)
      },
      ipAddress,
      userAgent
    })

    return updated
  }
}
