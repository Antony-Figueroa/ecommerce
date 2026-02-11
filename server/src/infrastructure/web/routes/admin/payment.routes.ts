import { Router, Request, Response } from 'express'
import { paymentService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { ValidationError } from '../../../../shared/errors/app.errors.js'

const router = Router()

router.use(authenticate)

/**
 * Registrar un pago para una venta
 */
router.post('/sales/:saleId/payments', async (req: Request, res: Response, next) => {
  try {
    const saleId = req.params.saleId as string
    const { amountUSD, amountBS, bcvRate, paymentMethod, reference, notes } = req.body

    if (!amountUSD || amountUSD <= 0) {
      throw new ValidationError('El monto en USD debe ser mayor a 0')
    }

    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')

    const payment = await paymentService.registerPayment({
      saleId,
      amountUSD: Number(amountUSD),
      amountBS: amountBS ? Number(amountBS) : (Number(amountUSD) * (bcvRate ? Number(bcvRate) : 0)),
      bcvRate: bcvRate ? Number(bcvRate) : 0,
      paymentMethod,
      reference,
      notes
    }, userId, ipAddress, userAgent)

    res.status(201).json(payment)
  } catch (error) {
    next(error)
  }
})

/**
 * Obtener el estado de pagos de una venta (pagos e instalamentos)
 */
router.get('/sales/:saleId/status', async (req: Request, res: Response, next) => {
  try {
    const saleId = req.params.saleId as string
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const status = await paymentService.getPaymentStatus(saleId, userId, ipAddress, userAgent)
    res.json(status)
  } catch (error) {
    next(error)
  }
})

/**
 * Crear un plan de pagos para una venta
 */
router.post('/sales/:saleId/installments', async (req: Request, res: Response, next) => {
  try {
    const saleId = req.params.saleId as string
    const { installments } = req.body

    if (!Array.isArray(installments) || installments.length === 0) {
      throw new ValidationError('Debe proporcionar al menos una cuota')
    }

    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')

    const result = await paymentService.createInstallmentPlan(
      saleId,
      installments.map((i: any) => ({
        amountUSD: Number(i.amountUSD),
        dueDate: new Date(i.dueDate)
      })),
      userId,
      ipAddress,
      userAgent
    )

    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

/**
 * Obtener comprobantes pendientes de verificación
 */
router.get('/proofs/pending', async (req: Request, res: Response, next) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const proofs = await paymentService.getPendingProofs(userId, ipAddress, userAgent)
    res.json(proofs)
  } catch (error) {
    next(error)
  }
})

/**
 * Verificar (aprobar/rechazar) un comprobante de pago
 */
router.post('/proofs/:proofId/verify', async (req: Request, res: Response, next) => {
  try {
    const proofId = req.params.proofId as string
    const { status, notes } = req.body

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new ValidationError('Estado de verificación inválido')
    }

    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')

    const result = await paymentService.verifyPaymentProof(proofId, status, notes, userId, ipAddress, userAgent)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
