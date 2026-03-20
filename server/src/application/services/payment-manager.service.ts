import { PaymentRepository, InstallmentRepository, SaleRepository, PaymentProofRepository } from '../../domain/repositories/business.repository.js'
import { ValidationError, NotFoundError } from '../../shared/errors/app.errors.js'
import { AuditService } from './audit.service.js'

export class PaymentManager {
  constructor(
    private paymentRepo: PaymentRepository,
    private installmentRepo: InstallmentRepository,
    private saleRepo: SaleRepository,
    private proofRepo: PaymentProofRepository,
    private auditService: AuditService
  ) {}

  async submitPaymentProof(data: {
    installmentId: string
    proofUrl: string
    amountUSD: number
    notes?: string
  }, userId?: string, ipAddress?: string, userAgent?: string) {
    const installment = await this.installmentRepo.findById(data.installmentId)
    if (!installment) throw new NotFoundError('Cuota')

    const proof = await this.proofRepo.create({
      installmentId: data.installmentId,
      proofUrl: data.proofUrl,
      amountUSD: data.amountUSD,
      notes: data.notes,
      status: 'PENDING'
    })

    await this.auditService.logAction({
      entityType: 'PAYMENT_PROOF',
      entityId: proof.id,
      action: 'SUBMIT',
      userId,
      details: { installmentId: data.installmentId, amountUSD: data.amountUSD },
      ipAddress,
      userAgent
    })

    return proof
  }

  async verifyPaymentProof(proofId: string, status: 'APPROVED' | 'REJECTED', adminNotes?: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const proof = await this.proofRepo.findById(proofId)
    if (!proof) throw new NotFoundError('Comprobante')

    if (proof.status !== 'PENDING') {
      throw new ValidationError('Este comprobante ya ha sido procesado')
    }

    const updatedProof = await this.proofRepo.update(proofId, {
      status,
      notes: adminNotes ? `${proof.notes || ''}\nAdmin: ${adminNotes}` : proof.notes
    })

    await this.auditService.logAction({
      entityType: 'PAYMENT_PROOF',
      entityId: proofId,
      action: status,
      userId,
      details: { adminNotes },
      ipAddress,
      userAgent
    })

    return updatedProof
  }

  async registerPayment(data: {
    saleId: string
    amountUSD: number
    amountBS: number
    bcvRate: number
    paymentMethod: string
    reference?: string
    notes?: string
  }, userId?: string, ipAddress?: string, userAgent?: string) {
    const sale = await this.saleRepo.findById(data.saleId)
    if (!sale) throw new NotFoundError('Venta')

    // 1. Crear el registro del pago
    const totalToPayUSD = Number(sale.totalUSD)
    const currentPaidUSD = Number(sale.paidAmountUSD || 0)
    const remainingUSD = totalToPayUSD - currentPaidUSD

    if (data.amountUSD > remainingUSD + 0.01) { // 0.01 for floating point margin
      throw new ValidationError(`El monto del pago ($${data.amountUSD}) excede el saldo pendiente ($${remainingUSD.toFixed(2)})`)
    }

    const payment = await this.paymentRepo.create(data)

    // 2. Actualizar el monto pagado en la venta
    const newPaidAmount = Number(sale.paidAmountUSD || 0) + data.amountUSD
    const isPaid = newPaidAmount >= Number(sale.totalUSD)

    await this.saleRepo.update(data.saleId, {
      paidAmountUSD: newPaidAmount,
      isPaid
    })

    // 3. Registrar en el log de auditoría del sistema
    await this.auditService.logAction({
      entityType: 'PAYMENT',
      entityId: payment.id,
      action: 'CREATE',
      userId,
      details: { 
        saleId: data.saleId, 
        amountUSD: data.amountUSD, 
        method: data.paymentMethod,
        isPaid 
      },
      ipAddress,
      userAgent
    })

    // 4. Registrar en el log de auditoría de la venta (legado/específico)
    await this.saleRepo.createAuditLog({
      saleId: data.saleId,
      action: 'PAYMENT_RECEIVED',
      reason: `Pago recibido: $${data.amountUSD.toFixed(2)} (${data.paymentMethod})`
    })

    return { payment, isPaid, newPaidAmount }
  }

  async updateInstallmentsWithPayment(saleId: string, paidAmount: number) {
    const installments = await this.installmentRepo.findBySaleId(saleId)
    const pendingInstallments = installments.filter(inst => inst.status !== 'PAID')

    let remainingPayment = paidAmount
    const updatedIds: string[] = []

    for (const inst of pendingInstallments) {
      if (remainingPayment <= 0) break

      const instPendingAmount = Number(inst.amountUSD) - Number(inst.paidAmount || 0)
      const paymentToApply = Math.min(remainingPayment, instPendingAmount)

      const newPaidAmount = Number(inst.paidAmount || 0) + paymentToApply
      const status = newPaidAmount >= Number(inst.amountUSD) ? 'PAID' : 'PARTIAL'

      await this.installmentRepo.update(inst.id, {
        paidAmount: newPaidAmount,
        status,
        paidAt: status === 'PAID' ? new Date() : undefined
      })

      updatedIds.push(inst.id)
      remainingPayment -= paymentToApply
    }

    return updatedIds
  }

  async createInstallmentPlan(saleId: string, plan: { amountUSD: number, dueDate: Date }[], userId?: string, ipAddress?: string, userAgent?: string) {
    const created = await this.installmentRepo.createMany(
      plan.map(inst => ({
        saleId,
        amountUSD: inst.amountUSD,
        dueDate: inst.dueDate,
        status: 'PENDING'
      }))
    )

    const totalUSD = plan.reduce((sum, i) => sum + i.amountUSD, 0)

    await this.auditService.logAction({
      entityType: 'INSTALLMENT_PLAN',
      action: 'CREATE',
      userId,
      details: { saleId, count: plan.length, totalUSD },
      ipAddress,
      userAgent
    })

    return created
  }
}
