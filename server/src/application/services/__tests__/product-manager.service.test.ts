import { jest } from '@jest/globals'
import { ProductManager } from '../product-manager.service.js'
import { NotFoundError, ValidationError } from '../../../shared/errors/app.errors.js'
import { CreateProductDTO } from '../../dtos/product.dto.js'

const mockProductRepo = {
  create: jest.fn<any>(),
  update: jest.fn<any>(),
  findById: jest.fn<any>(),
  findBySku: jest.fn<any>(),
  count: jest.fn<any>(),
  deleteImages: jest.fn<any>(),
}

const mockCategoryRepo = {
  findById: jest.fn<any>(),
}

const mockBrandRepo = {
  upsert: jest.fn<any>(),
}

const mockLogRepo = {
  create: jest.fn<any>(),
}

const mockFavoriteRepo = {
  findAllByProductId: jest.fn<any>(),
}

const mockNotificationService = {
  createNotification: jest.fn<any>(),
}

const mockAuditService = {
  logAction: jest.fn<any>(),
}

const mockPrisma = {
  $transaction: jest.fn((callback: any) => callback(mockPrisma)),
}

describe('ProductManager', () => {
  let productManager: ProductManager

  beforeEach(() => {
    jest.clearAllMocks()
    productManager = new ProductManager(
      mockPrisma as any,
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
      const data: CreateProductDTO = {
        name: 'Test Product',
        productCode: 'PC-001',
        description: 'Test Description',
        sku: 'TEST-001',
        categoryIds: ['cat1'],
        brand: 'Brand A',
        price: 100,
        purchasePrice: 80,
        stock: 10,
        images: [{ url: 'img1.jpg', isMain: true }]
      }

      mockCategoryRepo.findById.mockResolvedValue({ id: 'cat1', name: 'Test' })
      mockProductRepo.findBySku.mockResolvedValue(null)
      mockBrandRepo.upsert.mockResolvedValue({ id: 'brand1' })
      mockProductRepo.create.mockResolvedValue({ id: 'prod1', ...data })

      const result = await productManager.createProduct(data)

      expect(result.id).toBe('prod1')
      expect(mockProductRepo.create).toHaveBeenCalledWith(expect.anything(), mockPrisma)
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE' }), mockPrisma)
    })

    it('should generate SKU if not provided', async () => {
      const data: CreateProductDTO = {
        name: 'Auto SKU',
        productCode: 'PC-002',
        description: 'Auto SKU Description',
        categoryIds: ['cat1'],
        price: 50
      }

      mockCategoryRepo.findById.mockResolvedValue({ name: 'Pharmacy' })
      mockProductRepo.count.mockResolvedValue(10)
      mockProductRepo.findBySku.mockResolvedValue(null)
      mockBrandRepo.upsert.mockResolvedValue({ id: 'brand1' })
      mockProductRepo.create.mockResolvedValue({ id: 'prod2', ...data, sku: 'PHA-GEN-AUT-0011' })

      const result = await productManager.createProduct(data)

      expect(result.sku).toBeDefined()
      expect(mockProductRepo.create).toHaveBeenCalledWith(expect.objectContaining({ sku: 'PHA-GEN-AUT-0011' }), mockPrisma)
    })

    it('should throw ValidationError if SKU exists', async () => {
      mockProductRepo.findBySku.mockResolvedValue({ id: 'existing' })
      const data: CreateProductDTO = { 
        sku: 'EX-001', 
        name: 'Existing', 
        productCode: 'PC-003', 
        description: 'Existing Desc', 
        categoryIds: ['cat1'] 
      }
      await expect(productManager.createProduct(data)).rejects.toThrow(ValidationError)
    })
  })

  describe('updateProduct', () => {
    it('should update a product successfully', async () => {
      const existingProduct = { id: 'p1', stock: 5, price: 100, purchasePrice: 80 }
      const updateData = { stock: 10, price: 90 }

      mockProductRepo.findById.mockResolvedValue(existingProduct)
      mockCategoryRepo.findById.mockResolvedValue({ id: 'cat1' })
      mockProductRepo.update.mockResolvedValue({ ...existingProduct, ...updateData })
      mockFavoriteRepo.findAllByProductId.mockResolvedValue([])

      const result = await productManager.updateProduct('p1', updateData)

      expect(result.stock).toBe(10)
      expect(result.price).toBe(90)
      expect(mockLogRepo.create).toHaveBeenCalledWith(expect.objectContaining({ changeAmount: 5 }), mockPrisma)
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
