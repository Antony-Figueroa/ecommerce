import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { InventoryLogRepository, InventoryBatchRepository } from '../../domain/repositories/inventory.repository.js'

export class StockManager {
  constructor(
    private productRepo: ProductRepository,
    private logRepo: InventoryLogRepository,
    private inventoryBatchRepo: InventoryBatchRepository
  ) {}

  async deductStock(productId: string, quantity: number, reason: string, reference: string, tx?: any) {
    const product = await this.productRepo.findById(productId)
    if (!product) {
      throw new Error('Product not found')
    }
    if (product.stock < quantity) {
      throw new Error('Insufficient stock')
    }

    const previousStock = product.stock
    const newStock = previousStock - quantity

    const updatedProduct = await this.productRepo.update(productId, {
      stock: { decrement: quantity },
    }, tx)

    if (newStock <= 0) {
      await this.productRepo.update(productId, { inStock: false }, tx)
    }

    if (newStock <= (updatedProduct.minStock || 5)) {
      console.log(`Low stock alert: ${updatedProduct.name} is at ${newStock}`)
    }

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

    await this.logRepo.create({
      productId,
      changeType: 'SALE',
      previousStock,
      newStock,
      changeAmount: -quantity,
      reason: `${reason} ${reference}`,
    }, tx)

    return updatedProduct
  }

  async addStock(productId: string, quantity: number, reference: string, reason: string, tx?: any) {
    const product = await this.productRepo.findById(productId)
    if (!product) return

    const previousStock = product.stock
    const newStock = previousStock + quantity

    await this.productRepo.update(productId, {
      stock: newStock,
      inStock: newStock > 0,
    }, tx)

    await this.logRepo.create({
      productId,
      changeType: 'RESTOCK',
      previousStock,
      newStock,
      changeAmount: quantity,
      reason: `${reason} ${reference}`,
    }, tx)
  }
}
