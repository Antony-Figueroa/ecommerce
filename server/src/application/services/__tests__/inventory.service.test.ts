import { InventoryService } from '../inventory.service.js'

describe('InventoryService', () => {
  let inventoryService: InventoryService
  let mockProductRepo: any
  let mockCategoryRepo: any
  let mockBrandRepo: any
  let mockLogRepo: any
  let mockNotificationService: any
  let mockFavoriteRepo: any

  beforeEach(() => {
    mockProductRepo = {
      findMany: jest.fn(),
      count: jest.fn(),
      findBySku: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      deleteImages: jest.fn(),
    }
    mockCategoryRepo = {
      findById: jest.fn(),
    }
    mockBrandRepo = {
      findAll: jest.fn(),
      upsert: jest.fn(),
    }
    mockLogRepo = {
      create: jest.fn(),
      findAll: jest.fn(),
    }
    mockNotificationService = {
      notifyPriceChange: jest.fn(),
      notifyLowStock: jest.fn(),
    }
    mockFavoriteRepo = {
      findByProductId: jest.fn(),
    }

    inventoryService = new InventoryService(
      mockProductRepo,
      mockCategoryRepo,
      mockBrandRepo,
      mockLogRepo,
      mockNotificationService,
      mockFavoriteRepo
    )
  })

  describe('getInventoryReport', () => {
    it('should generate inventory report correctly', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product A',
          sku: 'SKU-A',
          stock: 10,
          minStock: 5,
          purchasePrice: 10,
          shippingCost: 2,
          price: 20,
          profitMargin: 1.67,
        },
        {
          id: '2',
          name: 'Product B',
          sku: 'SKU-B',
          stock: 2,
          minStock: 5,
          purchasePrice: 20,
          shippingCost: 5,
          price: 40,
          profitMargin: 1.6,
        }
      ]

      mockProductRepo.findMany.mockResolvedValue(mockProducts)

      const result = await inventoryService.getInventoryReport()

      expect(result.totalProducts).toBe(2)
      expect(result.totalItems).toBe(12) // 10 + 2
      
      // Total Cost: 10*10 + 2*20 = 100 + 40 = 140
      expect(result.totalCostUSD).toBe(140)
      
      // Total Value: 20*10 + 40*2 = 200 + 80 = 280
      expect(result.totalValueUSD).toBe(280)
      
      expect(result.potentialProfit).toBe(140) // 280 - 140
      expect(result.lowStockCount).toBe(1) // Product B
      expect(result.outOfStockCount).toBe(0)
    })
  })

  describe('calculateMargin and calculatePrice', () => {
    it('should calculate margin correctly', () => {
      // @ts-ignore - access private method
      const margin = inventoryService.calculateMargin(10, 15)
      expect(margin).toBe(1.5)
    })

    it('should calculate price correctly', () => {
      // @ts-ignore - access private method
      const price = inventoryService.calculatePrice(10, 1.5)
      expect(price).toBe(15)
    })

    it('should handle zero purchase price in margin', () => {
      // @ts-ignore - access private method
      const margin = inventoryService.calculateMargin(0, 15)
      expect(margin).toBe(0)
    })
  })

  describe('createProduct with batch data', () => {
    it('should create product with initial batch and price history', async () => {
      const productData = {
        name: 'Test Product',
        categoryId: 'cat1',
        brand: 'BrandX',
        purchasePrice: 10,
        profitMargin: 1.5,
        stock: 100,
        format: 'Tabletas',
        batchNumber: 'LOTE-001',
        expirationDate: '2025-12-31'
      }

      mockCategoryRepo.findById.mockResolvedValue({ id: 'cat1', name: 'Category1' })
      mockProductRepo.count.mockResolvedValue(0)
      mockProductRepo.findBySku.mockResolvedValue(null)
      mockBrandRepo.upsert.mockResolvedValue({ id: 'brand1', name: 'BrandX' })
      mockProductRepo.create.mockResolvedValue({ id: 'prod1', ...productData })

      await inventoryService.createProduct(productData)

      expect(mockProductRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        purchasePrice: 10,
        price: 15,
        profitMargin: 1.5,
        stock: 100,
        batches: {
          create: {
            batchNumber: 'LOTE-001',
            expirationDate: expect.any(Date),
            stock: 100,
            purchasePrice: 10,
            salePrice: 15
          }
        },
        priceHistory: {
          create: {
            purchasePrice: 10,
            salePrice: 15,
            batchQuantity: 100,
            batchNumber: 'LOTE-001'
          }
        }
      }))
    })
  })

  describe('updateProduct with restock batch', () => {
    it('should update stock and prices when restock batch is provided', async () => {
      const existingProduct = {
        id: 'prod1',
        name: 'Test Product',
        stock: 50,
        purchasePrice: 10,
        price: 15,
        profitMargin: 1.5
      }
      
      const restockData = {
        batch: {
          batchNumber: 'LOTE-002',
          expirationDate: '2026-01-01',
          purchasePrice: 12,
          salePrice: 20,
          stock: 30
        }
      }

      mockProductRepo.findById.mockResolvedValue(existingProduct)
      mockProductRepo.update.mockResolvedValue({ ...existingProduct, stock: 80, purchasePrice: 12, price: 20 })

      await inventoryService.updateProduct('prod1', restockData)

      expect(mockProductRepo.update).toHaveBeenCalledWith('prod1', expect.objectContaining({
        stock: 80,
        purchasePrice: 12,
        price: 20,
        profitMargin: 20/12,
        batches: {
          create: {
            batchNumber: 'LOTE-002',
            expirationDate: expect.any(Date),
            stock: 30,
            purchasePrice: 12,
            salePrice: 20
          }
        }
      }))
    })
  })

  describe('updateProduct price manual', () => {
    it('should recalculate margin when price is updated manually', async () => {
      const existingProduct = {
        id: 'prod1',
        purchasePrice: 10,
        price: 15,
        profitMargin: 1.5,
        stock: 100
      }

      mockProductRepo.findById.mockResolvedValue(existingProduct)
      
      await inventoryService.updateProduct('prod1', { price: 25 })

      expect(mockProductRepo.update).toHaveBeenCalledWith('prod1', expect.objectContaining({
        price: 25,
        profitMargin: 2.5
      }))
    })
  })

  describe('updatePricesByBCV', () => {
    it('should update prices based on ratio correctly', async () => {
      const mockProducts = [
        { id: '1', price: 100, currency: 'BS' },
        { id: '2', price: 200, currency: 'BS' },
      ]
      mockProductRepo.findMany.mockResolvedValue(mockProducts)

      await inventoryService.updatePricesByBCV(40, 36) // ratio 40/36 = 1.111...

      expect(mockProductRepo.update).toHaveBeenCalledWith('1', { price: 100 * (40/36) })
      expect(mockProductRepo.update).toHaveBeenCalledWith('2', { price: 200 * (40/36) })
    })
  })
})
