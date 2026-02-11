import { jest } from '@jest/globals'
import { PaymentService } from '../payment.service.js'
import { NotFoundError, ValidationError } from '../../../shared/errors/app.errors.js'

describe('PaymentService', () => {
  let paymentService: PaymentService
  let mockPaymentRepo: any
  let mockInstallmentRepo: any
  let mockSaleRepo: any
  let mockProofRepo: any
  let mockPaymentManager: any
  let mockAuditService: any

  beforeEach(() => {
    mockPaymentRepo = {
      create: jest.fn(),
      findBySaleId: jest.fn(),
    }
    mockInstallmentRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      findBySaleId: jest.fn(),
      createMany: jest.fn(),
    }
    mockSaleRepo = {
      findById: jest.fn(),
      update: jest.fn(),
      createAuditLog: jest.fn(),
    }
    mockProofRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findByStatus: jest.fn(),
    }
    mockPaymentManager = {
      submitPaymentProof: jest.fn(),
      verifyPaymentProof: jest.fn(),
      registerPayment: jest.fn(),
      updateInstallmentsWithPayment: jest.fn(),
    }
    mockAuditService = {
      logAction: jest.fn(),
    }

    paymentService = new PaymentService(
      mockPaymentRepo,
      mockInstallmentRepo,
      mockSaleRepo,
      mockProofRepo,
      mockPaymentManager,
      mockAuditService
    )
  })

  describe('submitPaymentProof', () => {
    it('should delegate to paymentManager', async () => {
      const data = { installmentId: 'inst1', proofUrl: 'url', amountUSD: 10 }
      await paymentService.submitPaymentProof(data, 'user1', '127.0.0.1', 'agent')
      expect(mockPaymentManager.submitPaymentProof).toHaveBeenCalledWith(data, 'user1', '127.0.0.1', 'agent')
    })
  })

  describe('verifyPaymentProof', () => {
    it('should throw NotFoundError if proof not found', async () => {
      mockProofRepo.findById.mockResolvedValue(null)
      await expect(paymentService.verifyPaymentProof('p1', 'APPROVED')).rejects.toThrow(NotFoundError)
    })

    it('should register payment if status is APPROVED', async () => {
      const mockProof = { id: 'p1', installment: { saleId: 's1' }, amountUSD: 100 }
      mockProofRepo.findById.mockResolvedValue(mockProof)
      mockPaymentManager.verifyPaymentProof.mockResolvedValue({ ...mockProof, status: 'APPROVED' })
      mockSaleRepo.findById.mockResolvedValue({ id: 's1', totalUSD: 1000, paidAmountUSD: 0 })
      mockPaymentManager.registerPayment.mockResolvedValue({ payment: { id: 'pay1' }, isPaid: false })

      await paymentService.verifyPaymentProof('p1', 'APPROVED', 'notes', 'u1')

      expect(mockPaymentManager.registerPayment).toHaveBeenCalled()
      expect(mockPaymentManager.updateInstallmentsWithPayment).toHaveBeenCalled()
    })
  })

  describe('registerPayment', () => {
    it('should call paymentManager and update installments', async () => {
      const data = { saleId: 's1', amountUSD: 50, amountBS: 1800, bcvRate: 36, paymentMethod: 'CASH' }
      mockPaymentManager.registerPayment.mockResolvedValue({ payment: { id: 'pay1' } })

      await paymentService.registerPayment(data, 'u1')

      expect(mockPaymentManager.registerPayment).toHaveBeenCalledWith(data, 'u1', undefined, undefined)
      expect(mockPaymentManager.updateInstallmentsWithPayment).toHaveBeenCalledWith('s1', 50)
    })
  })

  describe('createInstallmentPlan', () => {
    it('should create plan if totals match pending balance', async () => {
      const sale = { id: 's1', totalUSD: 100, paidAmountUSD: 20 }
      const installments = [{ amountUSD: 40, dueDate: new Date() }, { amountUSD: 40, dueDate: new Date() }]
      
      mockSaleRepo.findById.mockResolvedValue(sale)
      mockInstallmentRepo.createMany.mockResolvedValue([{ id: 'i1' }, { id: 'i2' }])

      const result = await paymentService.createInstallmentPlan('s1', installments, 'u1')

      expect(mockInstallmentRepo.createMany).toHaveBeenCalled()
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'CREATE' }))
      expect(result).toHaveLength(2)
    })

    it('should throw ValidationError if totals do not match', async () => {
      const sale = { id: 's1', totalUSD: 100, paidAmountUSD: 20 } // balance 80
      const installments = [{ amountUSD: 50, dueDate: new Date() }] // total 50
      
      mockSaleRepo.findById.mockResolvedValue(sale)

      await expect(paymentService.createInstallmentPlan('s1', installments))
        .rejects.toThrow(ValidationError)
    })
  })

  describe('updateInstallmentStatus', () => {
    it('should update status and paidAmount', async () => {
      const installment = { id: 'i1', amountUSD: 100 }
      mockInstallmentRepo.findById.mockResolvedValue(installment)
      mockInstallmentRepo.update.mockResolvedValue({ ...installment, status: 'PAID', paidAmount: 100 })

      const result = await paymentService.updateInstallmentStatus('i1', 'PAID', 100, 'u1')

      expect(mockInstallmentRepo.update).toHaveBeenCalledWith('i1', expect.objectContaining({ status: 'PAID', paidAmount: 100 }))
      expect(result.status).toBe('PAID')
    })
  })

  describe('getPaymentStatus', () => {
    it('should return combined payment info', async () => {
      const sale = { id: 's1', totalUSD: 100, paidAmountUSD: 40, isPaid: false }
      mockSaleRepo.findById.mockResolvedValue(sale)
      mockPaymentRepo.findBySaleId.mockResolvedValue([{ id: 'p1' }])
      mockInstallmentRepo.findBySaleId.mockResolvedValue([{ id: 'i1' }])

      const status = await paymentService.getPaymentStatus('s1')

      expect(status.totalUSD).toBe(100)
      expect(status.pendingAmountUSD).toBe(60)
      expect(status.payments).toHaveLength(1)
      expect(status.installments).toHaveLength(1)
    })
  })
})
