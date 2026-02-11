import { jest } from '@jest/globals'
import { ProductManager } from '../product-manager.service.js'
import { NotFoundError, ValidationError } from '../../../shared/errors/app.errors.js'

const mockProductRepo = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findBySku: jest.fn(),
  count: jest.fn(),
  deleteImages: jest.fn(),
}

const mockCategoryRepo = {
  findById: jest.fn(),
}

const mockBrandRepo = {
  upsert: jest.fn(),
}

const mockLogRepo = {
  create: jest.fn(),
}

const mockFavoriteRepo = {
  findAllByProductId: jest.fn(),
}

const mockNotificationService = {
  createNotification: jest.fn(),
}

const mockAuditService = {
  logAction: jest.fn(),
}

describe('ProductManager', () => {
  let productManager: ProductManager

  beforeEach(() => {
    jest.clearAllMocks()
    productManager = new ProductManager(
      mockProductRepo as any,
      mockCategoryRepo as any,
      mockBrandRepo as any,
      mockLogRepo as any,
      mockFavoriteRepo as any,
      mockNotificationService as any,
      mockAuditService as any
    )
  })

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const data = {
        name: 'Test Product',
        sku: 'TEST-001',
        categoryIds: ['cat1'],
        brand: 'Brand A',
        price: 100,
        purchasePrice: 80,
        stock: 10,
        images: [{ url: 'img1.jpg', isMain: true }]
      }

      mockProductRepo.findBySku.mockResolvedValue(null)
      mockBrandRepo.upsert.mockResolvedValue({ id: 'brand1' })
      mockProductRepo.create.mockResolvedValue({ id: 'prod1', ...data })

      const result = await productManager.createProduct(data)

      expect(result.id).toBe('prod1')
      expect(mockProductRepo.create).toHaveBeenCalled()
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE' }))
    })

    it('should generate SKU if not provided', async () => {
      const data = {
        name: 'Auto SKU',
        categoryIds: ['cat1'],
        price: 50
      }

      mockCategoryRepo.findById.mockResolvedValue({ name: 'Pharmacy' })
      mockProductRepo.count.mockResolvedValue(10)
      mockProductRepo.findBySku.mockResolvedValue(null)
      mockBrandRepo.upsert.mockResolvedValue({ id: 'brand1' })
      mockProductRepo.create.mockResolvedValue({ id: 'prod2', ...data, sku: 'PHA-AUT-0011' })

      const result = await productManager.createProduct(data)

      expect(result.sku).toBeDefined()
      expect(mockProductRepo.create).toHaveBeenCalledWith(expect.objectContaining({ sku: 'PHA-AUT-0011' }))
    })

    it('should throw ValidationError if SKU exists', async () => {
      mockProductRepo.findBySku.mockResolvedValue({ id: 'existing' })
      await expect(productManager.createProduct({ sku: 'EX-001' })).rejects.toThrow(ValidationError)
    })
  })

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const existingProduct = { id: 'p1', stock: 5, price: 100, purchasePrice: 80 }
      const updateData = { stock: 10, price: 90 }

      mockProductRepo.findById.mockResolvedValue(existingProduct)
      mockProductRepo.update.mockResolvedValue({ ...existingProduct, ...updateData })
      mockFavoriteRepo.findAllByProductId.mockResolvedValue([])

      const result = await productManager.updateProduct('p1', updateData)

      expect(result.stock).toBe(10)
      expect(result.price).toBe(90)
      expect(mockLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({ changeAmount: 5 }))
      expect(mockNotificationService.createNotification).not.toHaveBeenCalled() // No favorites notified in this mock
    })

    it('should throw NotFoundError if product not found', async () => {
      mockProductRepo.findById.mockResolvedValue(null)
      await expect(productManager.updateProduct('p1', {})).rejects.toThrow(NotFoundError)
    })

    it('should notify price drop and restock', async () => {
      const existingProduct = { id: 'p1', stock: 0, price: 100, slug: 'test' }
      const updateData = { stock: 5, price: 80 }

      mockProductRepo.findById.mockResolvedValue(existingProduct)
      mockProductRepo.update.mockResolvedValue({ ...existingProduct, ...updateData })
      mockFavoriteRepo.findAllByProductId.mockResolvedValue([{ userId: 'u1' }])

      await productManager.updateProduct('p1', updateData)

      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(2) // 1 for price drop, 1 for restock
    })
  })
})
