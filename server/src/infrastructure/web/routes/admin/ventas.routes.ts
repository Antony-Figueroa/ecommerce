import { Router, Request, Response } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { paymentService } from '../../../../shared/container.js'
import { ValidationError } from '../../../../shared/errors/app.errors.js'

const router = Router()

router.use(authenticate)

router.get('/:id/estado-cuotas', async (req: Request, res: Response, next) => {
  try {
    const saleId = req.params.id as string
    const status = await paymentService.getPaymentStatus(saleId)
    res.json({
      ...status,
      montoPagadoUSD: status.paidAmountUSD,
      montoPendienteUSD: status.pendingAmountUSD,
      cuotas: status.installments,
      pagos: status.payments
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/pagos', async (req: Request, res: Response, next) => {
  try {
    const saleId = req.params.id as string
    const payments = await paymentService.getPaymentsBySale(saleId)
    res.json({ pagos: payments })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/plan-cuotas', async (req: Request, res: Response, next) => {
  try {
    const saleId = req.params.id as string
    const cuotas = req.body.cuotas || req.body.installments

    if (!Array.isArray(cuotas) || cuotas.length === 0) {
      throw new ValidationError('Debe proporcionar al menos una cuota')
    }

    const result = await paymentService.createInstallmentPlan(
      saleId,
      cuotas.map((c: any) => ({
        amountUSD: Number(c.montoUSD ?? c.amountUSD),
        dueDate: new Date(c.fechaVencimiento ?? c.dueDate)
      }))
    )
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

router.post('/:id/pagos', async (req: Request, res: Response, next) => {
  try {
    const saleId = req.params.id as string
    const { montoUSD, montoBS, tasaBCV, metodoPago, referencia, notas, amountUSD, amountBS, bcvRate, paymentMethod, reference, notes } = req.body
    const finalAmountUSD = Number(montoUSD ?? amountUSD)
    const finalBcv = Number(tasaBCV ?? bcvRate ?? 0)

    if (!finalAmountUSD || finalAmountUSD <= 0) {
      throw new ValidationError('El monto en USD debe ser mayor a 0')
    }

    const payment = await paymentService.registerPayment({
      saleId,
      amountUSD: finalAmountUSD,
      amountBS: montoBS ? Number(montoBS) : amountBS ? Number(amountBS) : (finalAmountUSD * finalBcv),
      bcvRate: finalBcv,
      paymentMethod: metodoPago ?? paymentMethod ?? 'EFECTIVO',
      reference: referencia ?? reference,
      notes: notas ?? notes
    })

    res.status(201).json(payment)
  } catch (error) {
    next(error)
  }
})

export default router
