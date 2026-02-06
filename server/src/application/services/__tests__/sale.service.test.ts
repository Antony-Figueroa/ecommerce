import { SaleService } from '../sale.service.js'
import { NotFoundError } from '../../../shared/errors/app.errors.js'

describe('SaleService', () => {
  let saleService: SaleService
  let mockSaleRepo: any
  let mockProductRepo: any
  let mockLogRepo: any
  let mockBcvRepo: any
  let mockBatchRepo: any
  let mockNotificationRepo: any
  let mockSettingsRepo: any
  let mockNotificationService: any

  beforeEach(() => {
    mockSaleRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      findBySaleNumber: jest.fn(),
      findDuplicate: jest.fn(),
      createAuditLog: jest.fn(),
    }
    mockProductRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    }
    mockLogRepo = {
      create: jest.fn(),
    }
    mockBcvRepo = {
      getCurrentRate: jest.fn().mockResolvedValue(36),
    }
    mockBatchRepo = {
      findMany: jest.fn(),
      update: jest.fn(),
    }
    mockNotificationRepo = {
      create: jest.fn(),
    }
    mockSettingsRepo = {
      findByKey: jest.fn(),
    }
    mockNotificationService = {
      notifySaleStatusChange: jest.fn(),
      notifyLowStock: jest.fn(),
    }

    saleService = new SaleService(
      mockSaleRepo,
      mockProductRepo,
      mockLogRepo,
      mockBcvRepo,
      mockBatchRepo,
      mockNotificationRepo,
      mockSettingsRepo,
      mockNotificationService
    )
  })

  describe('createSale', () => {
    const mockProduct = {
      id: 'prod-1',
      name: 'Product 1',
      purchasePrice: 10,
      shippingCost: 2,
      stock: 20,
    }

    const saleData = {
      userId: 'user-1',
      items: [
        {
          productId: 'prod-1',
          name: 'Product 1',
          quantity: 2,
          unitPrice: 20,
        },
      ],
      bcvRate: 36,
    }

    it('should create a sale successfully', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct)
      mockSaleRepo.findBySaleNumber.mockResolvedValue(null)
      mockSaleRepo.create.mockResolvedValue({ id: 'sale-1', saleNumber: 'VTA-001' })
      mockBatchRepo.findMany.mockResolvedValue([
        { id: 'batch-1', stock: 10, expirationDate: new Date() },
        { id: 'batch-2', stock: 20, expirationDate: new Date() },
      ])

      const result = await saleService.createSale(saleData)

      expect(mockProductRepo.findById).toHaveBeenCalledWith('prod-1')
      expect(mockSaleRepo.create).toHaveBeenCalled()
      expect(mockProductRepo.update).toHaveBeenCalledWith('prod-1', expect.objectContaining({
        stock: 18,
        inStock: true,
      }))
      expect(mockLogRepo.create).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('should throw NotFoundError if product does not exist', async () => {
      mockProductRepo.findById.mockResolvedValue(null)

      await expect(saleService.createSale(saleData)).rejects.toThrow(NotFoundError)
    })

    it('should calculate totals correctly', async () => {
      mockProductRepo.findById.mockResolvedValue(mockProduct)
      mockSaleRepo.findBySaleNumber.mockResolvedValue(null)
      mockSaleRepo.create.mockImplementation((data: any) => Promise.resolve({ ...data, id: 'sale-1' }))
      mockBatchRepo.findMany.mockResolvedValue([])

      await saleService.createSale(saleData)

      const createCall = mockSaleRepo.create.mock.calls[0][0]
      expect(createCall.subtotalUSD).toBe(40) // 2 * 20
      expect(createCall.totalUSD).toBe(40)
      expect(createCall.totalBS).toBe(40 * 36)
      expect(createCall.profitUSD).toBe(16) // (20 - (10+2)) * 2 = 8 * 2 = 16
    })
  })
})
