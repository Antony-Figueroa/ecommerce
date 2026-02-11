import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { InventoryLogRepository, InventoryBatchRepository } from '../../domain/repositories/inventory.repository.js'

export class StockManager {
  constructor(
    private productRepo: ProductRepository,
    private logRepo: InventoryLogRepository,
    private inventoryBatchRepo: InventoryBatchRepository
  ) {}

  async deductStock(productId: string, quantity: number, reason: string, reference: string) {
    const product = await this.productRepo.findById(productId)
    if (!product) return

    const previousStock = product.stock
    const newStock = previousStock - quantity

    await this.productRepo.update(productId, {
      stock: newStock,
      inStock: newStock > 0,
    })

    // FEFO (First Expired First Out) or FIFO (First In First Out) depending on implementation
    // The current system uses inventory batches
    let remainingToDiscount = quantity
    const batchItems = await this.inventoryBatchRepo.findAvailableItemsByProduct(productId)

    for (const batchItem of batchItems) {
      if (remainingToDiscount <= 0) break

      const available = Math.max(0, Number(batchItem.quantity) - Number(batchItem.soldQuantity || 0))
      if (available <= 0) continue

      const discountFromThisBatch = Math.min(available, remainingToDiscount)
      await this.inventoryBatchRepo.updateItem(batchItem.id, {
        soldQuantity: Number(batchItem.soldQuantity || 0) + discountFromThisBatch,
      })
      remainingToDiscount -= discountFromThisBatch
    }

    await this.logRepo.create({
      productId,
      changeType: 'SALE',
      previousStock,
      newStock,
      changeAmount: -quantity,
      reason: `${reason} ${reference}`,
    })
  }

  async addStock(productId: string, quantity: number, reason: string, reference: string) {
    const product = await this.productRepo.findById(productId)
    if (!product) return

    const previousStock = product.stock
    const newStock = previousStock + quantity

    await this.productRepo.update(productId, {
      stock: newStock,
      inStock: newStock > 0,
    })

    await this.logRepo.create({
      productId,
      changeType: 'RESTOCK',
      previousStock,
      newStock,
      changeAmount: quantity,
      reason: `${reason} ${reference}`,
    })
  }
}
