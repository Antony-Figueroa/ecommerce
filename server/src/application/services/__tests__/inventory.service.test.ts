import { jest } from '@jest/globals'
import { InventoryService } from '../inventory.service.js'
import { NotFoundError } from '../../../shared/errors/app.errors.js'

describe('InventoryService', () => {
  let inventoryService: InventoryService
  let mockProductRepo: any
  let mockCategoryRepo: any
  let mockBrandRepo: any
  let mockLogRepo: any
  let mockProviderRepo: any
  let mockInventoryBatchRepo: any
  let mockNotificationService: any
  let mockFavoriteRepo: any
  let mockBatchManager: any
  let mockProductManager: any
  let mockAuditService: any

  beforeEach(() => {
    mockProductRepo = {
      findMany: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
    }
    mockCategoryRepo = {}
    mockBrandRepo = {}
    mockLogRepo = {
      findAll: jest.fn(),
    }
    mockProviderRepo = {
      findAll: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
    }
    mockInventoryBatchRepo = {}
    mockNotificationService = {
      createNotification: jest.fn(),
    }
    mockFavoriteRepo = {
      findAllByProductId: jest.fn(),
    }
    mockBatchManager = {
      createBatch: jest.fn(),
    }
    mockProductManager = {
      createProduct: jest.fn(),
      updateProduct: jest.fn(),
      getProductById: jest.fn(),
    }
    mockAuditService = {
      logAction: jest.fn(),
    }

    inventoryService = new InventoryService(
      mockProductRepo,
      mockCategoryRepo,
      mockBrandRepo,
      mockLogRepo,
      mockProviderRepo,
      mockInventoryBatchRepo,
      mockNotificationService,
      mockFavoriteRepo,
      mockBatchManager,
      mockProductManager,
      mockAuditService
    )
  })

  describe('updatePricesByBCV', () => {
    it('should update prices and notify users when rate changes', async () => {
      const mockProducts = [
        { id: '1', name: 'Prod 1', price: 100, currency: 'BS', slug: 'prod-1' }
      ]
      mockProductRepo.findMany.mockResolvedValue(mockProducts)
      mockFavoriteRepo.findAllByProductId.mockResolvedValue([{ userId: 'user-1' }])

      await inventoryService.updatePricesByBCV(40, 36)

      expect(mockProductRepo.update).toHaveBeenCalledWith('1', { price: 100 * (40 / 36) })
      expect(mockNotificationService.createNotification).toHaveBeenCalled()
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'BCV_UPDATE',
        action: 'UPDATE_PRICES'
      }))
    })

    it('should skip if previous rate is 0 or less', async () => {
      await inventoryService.updatePricesByBCV(40, 0)
      expect(mockProductRepo.findMany).not.toHaveBeenCalled()
    })
  })

  describe('createProvider', () => {
    it('should create a new provider if it does not exist', async () => {
      mockProviderRepo.findByName.mockResolvedValue(null)
      mockProviderRepo.create.mockResolvedValue({ id: 'prov-1', name: 'New Prov' })

      const provider = await inventoryService.createProvider({ name: 'New Prov' })

      expect(provider.id).toBe('prov-1')
      expect(mockProviderRepo.create).toHaveBeenCalled()
      expect(mockAuditService.logAction).toHaveBeenCalled()
    })

    it('should return existing provider if name matches', async () => {
      mockProviderRepo.findByName.mockResolvedValue({ id: 'prov-1', name: 'Existing Prov' })

      const provider = await inventoryService.createProvider({ name: 'Existing Prov' })

      expect(provider.id).toBe('prov-1')
      expect(mockProviderRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('deleteProduct', () => {
    it('should set isActive to false', async () => {
      mockProductRepo.findById.mockResolvedValue({ id: '1', isActive: true })

      const result = await inventoryService.deleteProduct('1')

      expect(result.success).toBe(true)
      expect(mockProductRepo.update).toHaveBeenCalledWith('1', { isActive: false })
    })

    it('should throw NotFoundError if product does not exist', async () => {
      mockProductRepo.findById.mockResolvedValue(null)

      await expect(inventoryService.deleteProduct('999')).rejects.toThrow(NotFoundError)
    })
  })

  describe('getInventoryReport', () => {
    it('should calculate report metrics correctly', async () => {
      const mockProducts = [
        { id: '1', name: 'P1', stock: 10, minStock: 5, purchasePrice: 50, price: 100, profitMargin: 50 },
        { id: '2', name: 'P2', stock: 2, minStock: 5, purchasePrice: 20, price: 50, profitMargin: 60 },
      ]
      mockProductRepo.findMany.mockResolvedValue(mockProducts)

      const report = await inventoryService.getInventoryReport()

      expect(report.totalProducts).toBe(2)
      expect(report.totalItems).toBe(12)
      expect(report.totalCostUSD).toBe(10 * 50 + 2 * 20)
      expect(report.totalValueUSD).toBe(10 * 100 + 2 * 50)
      expect(report.lowStockCount).toBe(1)
      expect(report.alerts.lowStock).toHaveLength(1)
      expect(report.alerts.lowStock[0].id).toBe('2')
    })
  })
})
