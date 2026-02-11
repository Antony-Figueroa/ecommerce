import { jest } from '@jest/globals'
import { SaleService } from '../sale.service.js'
import { NotFoundError, ValidationError } from '../../../shared/errors/app.errors.js'

describe('SaleService', () => {
  let saleService: SaleService
  let mockSaleRepo: any
  let mockProductRepo: any
  let mockBcvRepo: any
  let mockNotificationRepo: any
  let mockSettingsRepo: any
  let mockNotificationService: any
  let mockPaymentService: any
  let mockAuditService: any
  let mockStockManager: any
  let mockSaleCalculator: any
  let mockLogRepo: any

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
      updateItem: jest.fn(),
      getSummary: jest.fn(),
    }
    mockProductRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    }
    mockBcvRepo = {
      getCurrentRate: jest.fn().mockResolvedValue(36),
    }
    mockNotificationRepo = {
      create: jest.fn(),
    }
    mockSettingsRepo = {
      findByKey: jest.fn(),
    }
    mockNotificationService = {
      createNotification: jest.fn(),
      notifySaleStatusChange: jest.fn(),
    }
    mockPaymentService = {
      getPaymentStatus: jest.fn(),
    }
    mockAuditService = {
      logAction: jest.fn(),
    }
    mockStockManager = {
      addStock: jest.fn(),
      deductStock: jest.fn(),
    }
    mockSaleCalculator = {
      calculateItemTotals: jest.fn().mockReturnValue({ subtotalUSD: 40, totalUSD: 40, totalBS: 1440, profitUSD: 16 }),
      calculateSaleTotals: jest.fn().mockReturnValue({ subtotalUSD: 40, shippingCostUSD: 0, totalUSD: 40, totalBS: 1440, profitUSD: 16 }),
    }
    mockLogRepo = {
      create: jest.fn(),
    }

    saleService = new SaleService(
      mockSaleRepo,
      mockProductRepo,
      mockBcvRepo,
      mockNotificationRepo,
      mockSettingsRepo,
      mockNotificationService,
      mockPaymentService,
      mockAuditService,
      mockStockManager,
      mockSaleCalculator,
      mockLogRepo
    )
  })

  describe('createSale', () => {
    const mockProduct = { id: 'p1', name: 'Prod 1', stock: 10 }
    const saleData = {
      items: [{ productId: 'p1', quantity: 2, unitPrice: 20 }],
      customerPhone: '123456'
    }

    it('should create sale successfully', async () => {
      mockSaleRepo.findDuplicate.mockResolvedValue(null)
      mockProductRepo.findById.mockResolvedValue(mockProduct)
      mockSaleRepo.create.mockResolvedValue({ id: 's1', saleNumber: 'V-1' })

      const result = await saleService.createSale(saleData)

      expect(mockSaleRepo.create).toHaveBeenCalled()
      expect(mockStockManager.deductStock).toHaveBeenCalled()
      expect(result.id).toBe('s1')
    })

    it('should throw ValidationError if duplicate found', async () => {
      mockSaleRepo.findDuplicate.mockResolvedValue({ id: 's0' })
      await expect(saleService.createSale(saleData)).rejects.toThrow(ValidationError)
    })
  })

  describe('getSaleById', () => {
    it('should return sale if found', async () => {
      mockSaleRepo.findById.mockResolvedValue({ id: 's1' })
      const result = await saleService.getSaleById('s1')
      expect(result.id).toBe('s1')
    })

    it('should throw NotFoundError if not found', async () => {
      mockSaleRepo.findById.mockResolvedValue(null)
      await expect(saleService.getSaleById('s1')).rejects.toThrow(NotFoundError)
    })
  })

  describe('confirmPayment', () => {
    it('should confirm payment and update status', async () => {
      const sale = { id: 's1', status: 'PENDING', saleNumber: 'V-1', userId: 'u1' }
      mockSaleRepo.findById.mockResolvedValue(sale)
      mockSaleRepo.update.mockResolvedValue({ ...sale, status: 'COMPLETED' })

      const result = await saleService.confirmPayment('s1', 100)

      expect(mockSaleRepo.update).toHaveBeenCalledWith('s1', expect.objectContaining({ status: 'COMPLETED' }))
      expect(mockNotificationRepo.create).toHaveBeenCalled()
    })
  })

  describe('cancelSale', () => {
    it('should cancel sale and restore stock', async () => {
      const sale = { id: 's1', status: 'PENDING', items: [{ productId: 'p1', quantity: 1 }] }
      mockSaleRepo.findById.mockResolvedValue(sale)
      mockSaleRepo.update.mockResolvedValue({ ...sale, status: 'CANCELLED' })

      await saleService.cancelSale('s1')

      expect(mockStockManager.addStock).toHaveBeenCalled()
      expect(mockSaleRepo.update).toHaveBeenCalledWith('s1', { status: 'CANCELLED' })
    })
  })

  describe('updateSaleItemStatus', () => {
    it('should update item status and restore stock if rejected', async () => {
      const sale = { id: 's1', items: [{ id: 'i1', productId: 'p1', quantity: 1, status: 'PENDING' }] }
      mockSaleRepo.findById.mockResolvedValue(sale)
      mockSaleRepo.updateItem.mockResolvedValue({ id: 'i1', status: 'REJECTED' })

      await saleService.updateSaleItemStatus('s1', 'i1', 'REJECTED')

      expect(mockSaleRepo.updateItem).toHaveBeenCalledWith('i1', { status: 'REJECTED' })
      expect(mockStockManager.addStock).toHaveBeenCalled()
    })
  })

  describe('getSalesSummary', () => {
    it('should return summary from repo', async () => {
      const mockSummary = [{ status: 'COMPLETED', totalUSD: 100, totalBS: 3600 }]
      mockSaleRepo.getSummary.mockResolvedValue(mockSummary)

      const result = await saleService.getSalesSummary()

      expect(result.totalSales).toBe(1)
      expect(result.summaryUSD).toBeDefined()
      expect(result.summaryUSD.total).toBe(100)
    })
  })
})
