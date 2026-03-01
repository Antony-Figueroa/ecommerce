import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { InventoryLogRepository, InventoryBatchRepository } from '../../domain/repositories/inventory.repository.js'

export class StockManager {
  constructor(
    private productRepo: ProductRepository,
    private logRepo: InventoryLogRepository,
    private inventoryBatchRepo: InventoryBatchRepository
  ) {}

  async deductStock(productId: string, quantity: number, reason: string, reference: string) {
    return this.prisma.$transaction(async (tx) => {
      const product = await this.productRepo.findById(productId)
      if (!product) {
        throw new Error('Product not found')
      }
      if (product.stock < quantity) {
        throw new Error('Insufficient stock')
      }

      const previousStock = product.stock
      const newStock = previousStock - quantity

      // 1. Update product stock
      const updatedProduct = await this.productRepo.update(productId, {
        stock: newStock,
        inStock: newStock > 0,
      }, tx)

      // Point 5: Low stock alert
      if (newStock <= (updatedProduct.minStock || 5)) {
        console.log(`Low stock alert: ${updatedProduct.name} is at ${newStock}`)
      }

      // 2. Update inventory batches (FEFO/FIFO)
      let remainingToDiscount = quantity
      const batchItems = await this.inventoryBatchRepo.findAvailableItemsByProduct(productId, tx)

      for (const batchItem of batchItems) {
        if (remainingToDiscount <= 0) break

        const available = Math.max(0, Number(batchItem.quantity) - Number(batchItem.soldQuantity || 0))
        if (available <= 0) continue

        const discountFromThisBatch = Math.min(available, remainingToDiscount)
        await this.inventoryBatchRepo.updateItem(batchItem.id, {
          soldQuantity: Number(batchItem.soldQuantity || 0) + discountFromThisBatch,
        }, tx)
        remainingToDiscount -= discountFromThisBatch
      }

      // 3. Create inventory log
      await this.logRepo.create({
        productId,
        changeType: 'SALE',
        previousStock,
        newStock,
        changeAmount: -quantity,
        reason: `${reason} ${reference}`,
      }, tx)

      return updatedProduct
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
