import { Router, Request, Response } from 'express'
import { authenticate } from '../../middleware/auth.middleware.js'
import { paymentService } from '../../../../shared/container.js'
import { ValidationError } from '../../../../shared/errors/app.errors.js'

const router = Router()

router.use(authenticate)

router.patch('/:id', async (req: Request, res: Response, next) => {
  try {
    const { estado, montoPagado } = req.body
    if (!estado) {
      throw new ValidationError('El estado es obligatorio')
    }
    const estadosMap: Record<string, string> = {
      PENDIENTE: 'PENDING',
      PAGADA: 'PAID',
      PARCIAL: 'PARTIAL',
      VENCIDA: 'OVERDUE',
      PENDING: 'PENDING',
      PAID: 'PAID',
      PARTIAL: 'PARTIAL',
      OVERDUE: 'OVERDUE'
    }
    const finalStatus = estadosMap[String(estado).toUpperCase()]
    if (!finalStatus) {
      throw new ValidationError('Estado inválido')
    }
    const updated = await paymentService.updateInstallmentStatus(
      req.params.id as string,
      finalStatus,
      montoPagado !== undefined ? Number(montoPagado) : undefined
    )
    res.json(updated)
  } catch (error) {
    next(error)
  }
})

export default router
