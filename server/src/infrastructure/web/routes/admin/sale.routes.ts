import { Router, Request, Response } from 'express'
import { saleService, bcvService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate, saleCreateSchema } from '../../middleware/validation.middleware.js'

const router = Router()

router.use(authenticate)

router.post('/', validate(saleCreateSchema), async (req: Request, res: Response) => {
  try {
    const sale = await saleService.createSale(req.body)
    res.status(201).json(sale)
  } catch (error) {
    if (error instanceof Error && error.message.includes('stock')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al crear venta' })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const result = await saleService.getAllSales({
      status,
      startDate,
      endDate,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas' })
  }
})

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const summary = await saleService.getSalesSummary({
      startDate,
      endDate,
    })
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen de ventas' })
  }
})

router.get('/recent', async (req: Request, res: Response) => {
  try {
    const sales = await saleService.getRecentSales(parseInt(req.query.limit as string) || 10)
    res.json({ sales })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas recientes' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sale = await saleService.getSaleById(req.params.id as string)
    res.json(sale)
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al obtener venta' })
  }
})

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, reason } = req.body
    const userId = (req as any).user?.id // Extract userId from auth middleware
    const sale = await saleService.updateSaleStatus(req.params.id as string, status, userId, reason)
    res.json(sale)
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    if (error instanceof Error && error.message.includes('inválido')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
})

router.patch('/:id/delivery-status', async (req: Request, res: Response) => {
  try {
    const { deliveryStatus, reason } = req.body
    const userId = (req as any).user?.id
    const sale = await saleService.updateDeliveryStatus(req.params.id as string, deliveryStatus, userId, reason)
    res.json(sale)
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ error: error.message })
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Error al actualizar estado de entrega' })
  }
})

router.post('/:id/confirm-payment', async (req: Request, res: Response) => {
  try {
    const { amount, reason } = req.body
    const userId = (req as any).user?.id
    
    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'El monto es obligatorio' })
    }

    const sale = await saleService.confirmPayment(req.params.id as string, Number(amount), userId, reason)
    res.json(sale)
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message || 'Error al confirmar pago' })
  }
})

router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const sale = await saleService.cancelSale(req.params.id as string)
    res.json(sale)
  } catch (error) {
    if (error instanceof Error && error.message.includes('ya está')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al cancelar venta' })
  }
})

router.get('/bcv/current', async (req: Request, res: Response) => {
  try {
    const rate = await bcvService.getCurrentRate()
    res.json({ rate })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tasa BCV' })
  }
})

router.post('/bcv', async (req: Request, res: Response) => {
  try {
    const { rate, source } = req.body
    const bcvRecord = await bcvService.setRate(rate, source)
    res.status(201).json(bcvRecord)
  } catch (error) {
    res.status(500).json({ error: 'Error al establecer tasa BCV' })
  }
})

router.get('/bcv/history', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query
    const history = await bcvService.getRateHistory(parseInt(limit as string) || 50)
    res.json({ history })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial BCV' })
  }
})

export default router

