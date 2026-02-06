import { SaleService } from '../sale.service.js'
import { ValidationError, NotFoundError } from '../../../shared/errors/app.errors.js'

describe('SaleService Sync & Delivery Status', () => {
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
      const mockSale = { id: 'sale-1', status: 'PENDING', isPaid: true }
      mockSaleRepo.findById.mockResolvedValue(mockSale)
      mockSaleRepo.update.mockResolvedValue({ ...mockSale, status: 'COMPLETED' })

      const result = await saleService.updateSaleStatus('sale-1', 'COMPLETED')

      expect(result.status).toBe('COMPLETED')
      expect(mockSaleRepo.update).toHaveBeenCalledWith('sale-1', { status: 'COMPLETED' })
      expect(mockSaleRepo.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'STATUS_CHANGE',
        newStatus: 'COMPLETED'
      }))
    })

    it('should allow other statuses even if not paid', async () => {
      const mockSale = { id: 'sale-1', status: 'PENDING', isPaid: false }
      mockSaleRepo.findById.mockResolvedValue(mockSale)
      mockSaleRepo.update.mockResolvedValue({ ...mockSale, status: 'PROCESSING' })

      const result = await saleService.updateSaleStatus('sale-1', 'PROCESSING')

      expect(result.status).toBe('PROCESSING')
      expect(mockSaleRepo.update).toHaveBeenCalledWith('sale-1', { status: 'PROCESSING' })
    })
  })

  describe('updateDeliveryStatus', () => {
    it('should update delivery status and create audit log', async () => {
      const mockSale = { id: 'sale-1', deliveryStatus: 'NOT_DELIVERED', customerPhone: '123456' }
      mockSaleRepo.findById.mockResolvedValue(mockSale)
      mockSaleRepo.update.mockResolvedValue({ ...mockSale, deliveryStatus: 'IN_TRANSIT' })

      const result = await saleService.updateDeliveryStatus('sale-1', 'IN_TRANSIT', 'admin-1', 'En camino')

      expect(result.deliveryStatus).toBe('IN_TRANSIT')
      expect(mockSaleRepo.update).toHaveBeenCalledWith('sale-1', { deliveryStatus: 'IN_TRANSIT' })
      expect(mockSaleRepo.createAuditLog).toHaveBeenCalledWith({
        saleId: 'sale-1',
        action: 'DELIVERY_STATUS_CHANGE',
        oldDeliveryStatus: 'NOT_DELIVERED',
        newDeliveryStatus: 'IN_TRANSIT',
        userId: 'admin-1',
        reason: 'En camino'
      })
    })

    it('should throw ValidationError for invalid delivery status', async () => {
      const mockSale = { id: 'sale-1', deliveryStatus: 'NOT_DELIVERED' }
      mockSaleRepo.findById.mockResolvedValue(mockSale)

      await expect(
        saleService.updateDeliveryStatus('sale-1', 'INVALID_STATUS')
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('confirmPayment', () => {
    it('should set isPaid to true and status to COMPLETED', async () => {
      const mockSale = { id: 'sale-1', status: 'PENDING', isPaid: false }
      mockSaleRepo.findById.mockResolvedValue(mockSale)
      mockSaleRepo.update.mockResolvedValue({ ...mockSale, status: 'COMPLETED', isPaid: true, paidAmountUSD: 100 })

      const result = await saleService.confirmPayment('sale-1', 100, 'admin-1', 'Pago Zelle')

      expect(result.isPaid).toBe(true)
      expect(result.status).toBe('COMPLETED')
      expect(mockSaleRepo.update).toHaveBeenCalledWith('sale-1', {
        status: 'COMPLETED',
        isPaid: true,
        paidAmountUSD: 100
      })
      expect(mockSaleRepo.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        action: 'PAYMENT_CONFIRMED',
        newStatus: 'COMPLETED'
      }))
    })
  })
})
