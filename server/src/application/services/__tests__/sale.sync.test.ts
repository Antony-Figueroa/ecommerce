import { jest } from '@jest/globals'
import { SaleService } from '../sale.service.js'
import { ValidationError, NotFoundError } from '../../../shared/errors/app.errors.js'

describe('SaleService Sync & Delivery Status', () => {
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
      calculateItemTotals: jest.fn(),
      calculateSaleTotals: jest.fn(),
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

  describe('updateSaleStatus', () => {
    it('should block COMPLETED status if sale is not paid', async () => {
      const mockSale = { id: 'sale-1', status: 'PENDING', isPaid: false }
      mockSaleRepo.findById.mockResolvedValue(mockSale)

      await expect(
        saleService.updateSaleStatus('sale-1', 'COMPLETED')
      ).rejects.toThrow(ValidationError)
      
      expect(mockSaleRepo.update).not.toHaveBeenCalled()
    })

    it('should allow COMPLETED status if sale is paid', async () => {
      const mockSale = { id: 'sale-1', status: 'PENDING', isPaid: true, saleNumber: 'V-1', customerName: 'Test' }
      mockSaleRepo.findById.mockResolvedValue(mockSale)
      mockSaleRepo.update.mockResolvedValue({ ...mockSale, status: 'COMPLETED' })

      const result = await saleService.updateSaleStatus('sale-1', 'COMPLETED')

      expect(result.status).toBe('COMPLETED')
      expect(mockSaleRepo.update).toHaveBeenCalledWith('sale-1', { status: 'COMPLETED' })
    })
  })

  describe('updateDeliveryStatus', () => {
    it('should update delivery status and notify', async () => {
      const mockSale = { id: 'sale-1', deliveryStatus: 'NOT_DELIVERED', saleNumber: 'V-1', customerName: 'Test' }
      mockSaleRepo.findById.mockResolvedValue(mockSale)
      mockSaleRepo.update.mockResolvedValue({ ...mockSale, deliveryStatus: 'DELIVERED' })

      const result = await saleService.updateDeliveryStatus('sale-1', 'DELIVERED')

      expect(result.deliveryStatus).toBe('DELIVERED')
      expect(mockSaleRepo.update).toHaveBeenCalledWith('sale-1', { deliveryStatus: 'DELIVERED' })
    })

    it('should throw ValidationError for invalid status', async () => {
      const mockSale = { id: 'sale-1', deliveryStatus: 'NOT_DELIVERED' }
      mockSaleRepo.findById.mockResolvedValue(mockSale)

      await expect(
        saleService.updateDeliveryStatus('sale-1', 'INVALID_STATUS')
      ).rejects.toThrow(ValidationError)
    })
  })
})
