import { Router, Request, Response } from 'express'
import { SaleService } from '../../services/sale.service.js'
import { BCVService } from '../../services/bcv.service.js'
import { authenticate } from '../../middleware/auth.js'
import { validate, saleCreateSchema } from '../../middleware/validation.js'

const router = Router()

router.use(authenticate)

router.post('/', validate(saleCreateSchema), async (req: Request, res: Response) => {
  try {
    const sale = await SaleService.createSale(req.body)
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
    const result = await SaleService.getAllSales({
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
    const summary = await SaleService.getSalesSummary({
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
    const sales = await SaleService.getRecentSales(parseInt(req.query.limit as string) || 10)
    res.json({ sales })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas recientes' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const sale = await SaleService.getSaleById(req.params.id as string)
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
    const { status } = req.body
    const sale = await SaleService.updateSaleStatus(req.params.id as string, status)
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

router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const sale = await SaleService.cancelSale(req.params.id as string)
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
    const rate = await BCVService.getCurrentRate()
    res.json({ rate })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tasa BCV' })
  }
})

router.post('/bcv', async (req: Request, res: Response) => {
  try {
    const { rate, source } = req.body
    const bcvRecord = await BCVService.setRate(rate, source)
    res.status(201).json(bcvRecord)
  } catch (error) {
    res.status(500).json({ error: 'Error al establecer tasa BCV' })
  }
})

router.get('/bcv/history', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query
    const history = await BCVService.getRateHistory(parseInt(limit as string) || 50)
    res.json({ history })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial BCV' })
  }
})

export default router
