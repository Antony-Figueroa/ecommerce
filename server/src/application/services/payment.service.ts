import { PaymentRepository, InstallmentRepository, SaleRepository, PaymentProofRepository } from '../../domain/repositories/business.repository.js'
import { ValidationError, NotFoundError } from '../../shared/errors/app.errors.js'
import { PaymentManager } from './payment-manager.service.js'
import { AuditService } from './audit.service.js'

export class PaymentService {
  constructor(
    private paymentRepo: PaymentRepository,
    private installmentRepo: InstallmentRepository,
    private saleRepo: SaleRepository,
    private proofRepo: PaymentProofRepository,
    private paymentManager: PaymentManager,
    private auditService: AuditService
  ) {}

  async submitPaymentProof(data: {
    installmentId: string
    proofUrl: string
    amountUSD: number
    notes?: string
  }, userId?: string, ipAddress?: string, userAgent?: string) {
    return this.paymentManager.submitPaymentProof(data, userId, ipAddress, userAgent)
  }

  async verifyPaymentProof(proofId: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const proof = await this.proofRepo.findById(proofId)
    if (!proof) throw new NotFoundError('Comprobante')

    const updatedProof = await this.paymentManager.verifyPaymentProof(proofId, status, adminNotes, userId, ipAddress, userAgent)

    if (status === 'APPROVED') {
      const installment = proof.installment
      await this.registerPayment({
        saleId: installment.saleId,
        amountUSD: Number(proof.amountUSD),
        amountBS: 0,
        bcvRate: 0,
        paymentMethod: 'TRANSFERENCIA',
        reference: `Comprobante: ${proof.id}`,
        notes: `Pago aprobado desde comprobante. ${adminNotes || ''}`
      }, userId, ipAddress, userAgent)
    }

    return updatedProof
  }

  async getPendingProofs(userId?: string, ipAddress?: string, userAgent?: string) {
    // Audit log for accessing pending proofs
    await this.auditService.logAction({
      entityType: 'PAYMENT_PROOF',
      action: 'VIEW_PENDING',
      userId,
      ipAddress,
      userAgent
    })
    return this.proofRepo.findByStatus('PENDING')
  }

  async getPaymentsBySale(saleId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const sale = await this.saleRepo.findById(saleId)
    if (!sale) throw new NotFoundError('Venta')

    // Audit log for accessing sale payments
    await this.auditService.logAction({
      entityType: 'PAYMENT',
      action: 'VIEW_SALE_PAYMENTS',
      userId,
      details: { saleId, saleNumber: sale.saleNumber },
      ipAddress,
      userAgent
    })
    return this.paymentRepo.findBySaleId(saleId)
  }

  async updateInstallmentStatus(installmentId: string, status: string, paidAmount?: number, userId?: string, ipAddress?: string, userAgent?: string) {
    const installment = await this.installmentRepo.findById(installmentId)
    if (!installment) throw new NotFoundError('Cuota')
    
    const updateData: any = { status }
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount
      updateData.paidAt = paidAmount >= Number(installment.amountUSD) ? new Date() : undefined
      if (paidAmount >= Number(installment.amountUSD)) {
        updateData.status = 'PAID'
      } else if (paidAmount > 0) {
        updateData.status = 'PARTIAL'
      }
    }

    const updated = await this.installmentRepo.update(installmentId, updateData)

    await this.auditService.logAction({
      entityType: 'INSTALLMENT',
      entityId: installmentId,
      action: 'UPDATE_STATUS',
      userId,
      details: { status, paidAmount },
      ipAddress,
      userAgent
    })

    return updated
  }

  async registerPayment(data: {
    saleId: string
    amountUSD: number
    amountBS: number
    bcvRate: number
    paymentMethod: string
    reference?: string
    notes?: string
  }, userId?: string, ipAddress?: string, userAgent?: string, tx?: any) {
    const result = await this.paymentManager.registerPayment(data, userId, ipAddress, userAgent, tx)
    await this.paymentManager.updateInstallmentsWithPayment(data.saleId, data.amountUSD, tx)
    return result.payment
  }

  async createInstallmentPlan(saleId: string, plan: { amountUSD: number, dueDate: Date }[], userId?: string, ipAddress?: string, userAgent?: string, tx?: any) {
    const sale = await this.saleRepo.findById(saleId)
    if (!sale) throw new NotFoundError('Venta')

    // Point 4: Validate installment plan totals
    const totalInstallmentsUSD = plan.reduce((sum, i) => sum + Number(i.amountUSD), 0)
    const remainingToPlanUSD = Number(sale.totalUSD) - Number(sale.paidAmountUSD || 0)

    if (Math.abs(totalInstallmentsUSD - remainingToPlanUSD) > 0.01) {
      throw new ValidationError(`El total de las cuotas ($${totalInstallmentsUSD.toFixed(2)}) debe ser igual al saldo pendiente de la venta ($${remainingToPlanUSD.toFixed(2)})`)
    }

    return this.paymentManager.createInstallmentPlan(saleId, plan, userId, ipAddress, userAgent, tx)
  }

  async getPaymentStatus(saleId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const [sale, payments, installments] = await Promise.all([
      this.saleRepo.findById(saleId),
      this.paymentRepo.findBySaleId(saleId),
      this.installmentRepo.findBySaleId(saleId)
    ])

    if (!sale) throw new NotFoundError('Venta')

    // Audit log for accessing payment status
    await this.auditService.logAction({
      entityType: 'PAYMENT',
      action: 'VIEW_STATUS',
      userId,
      details: { saleId, saleNumber: sale.saleNumber },
      ipAddress,
      userAgent
    })

    const totalUSD = Number(sale.totalUSD)
    const paidAmountUSD = Number(sale.paidAmountUSD || 0)
    const pendingAmountUSD = totalUSD - paidAmountUSD

    return {
      totalUSD,
      paidAmountUSD,
      pendingAmountUSD,
      isPaid: sale.isPaid,
      payments,
      installments
    }
  }
}
