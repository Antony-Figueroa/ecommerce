import { jest } from '@jest/globals'
import { StockManager } from '../stock-manager.service.js'

describe('StockManager', () => {
  let stockManager: StockManager
  let mockProductRepo: any
  let mockLogRepo: any
  let mockInventoryBatchRepo: any

  beforeEach(() => {
    mockProductRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    }
    mockLogRepo = {
      create: jest.fn(),
    }
    mockInventoryBatchRepo = {
      findAvailableItemsByProduct: jest.fn(),
      updateItem: jest.fn(),
    }

    stockManager = new StockManager(
      mockProductRepo,
      mockLogRepo,
      mockInventoryBatchRepo
    )
  })

  describe('deductStock', () => {
    it('should deduct stock and update batches', async () => {
      const productId = 'p1'
      const product = { id: productId, stock: 10 }
      const batchItems = [
        { id: 'b1', quantity: 6, soldQuantity: 0 },
        { id: 'b2', quantity: 10, soldQuantity: 0 }
      ]

      mockProductRepo.findById.mockResolvedValue(product)
      mockInventoryBatchRepo.findAvailableItemsByProduct.mockResolvedValue(batchItems)

      await stockManager.deductStock(productId, 8, 'Sale', 'REF1')

      expect(mockProductRepo.update).toHaveBeenCalledWith(productId, {
        stock: 2,
        inStock: true
      })
      
      // Should deduct 6 from first batch and 2 from second batch
      expect(mockInventoryBatchRepo.updateItem).toHaveBeenCalledWith('b1', { soldQuantity: 6 })
      expect(mockInventoryBatchRepo.updateItem).toHaveBeenCalledWith('b2', { soldQuantity: 2 })
      
      expect(mockLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        productId,
        changeAmount: -8,
        newStock: 2
      }))
    })

    it('should return if product not found', async () => {
      mockProductRepo.findById.mockResolvedValue(null)
      await stockManager.deductStock('p1', 5, 'Sale', 'REF1')
      expect(mockProductRepo.update).not.toHaveBeenCalled()
    })
  })

  describe('addStock', () => {
    it('should add stock correctly', async () => {
      const productId = 'p1'
      const product = { id: productId, stock: 5 }
      
      mockProductRepo.findById.mockResolvedValue(product)

      await stockManager.addStock(productId, 3, 'Restock', 'REF2')

      expect(mockProductRepo.update).toHaveBeenCalledWith(productId, {
        stock: 8,
        inStock: true
      })
      
      expect(mockLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        productId,
        changeAmount: 3,
        newStock: 8
      }))
    })
  })
})
