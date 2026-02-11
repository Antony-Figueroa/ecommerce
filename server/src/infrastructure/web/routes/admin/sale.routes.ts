import { Router, Request, Response } from 'express'
import { saleService, bcvService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate, saleCreateSchema } from '../../middleware/validation.middleware.js'
import { NotFoundError, ValidationError } from '../../../../shared/errors/app.errors.js'

const router = Router()
console.log('Admin Sale Routes Loaded')

router.use(authenticate)

router.patch('/:id/items/:itemId/status', async (req: Request, res: Response, next) => {
  console.log(`PATCH Item Status: saleId=${req.params.id}, itemId=${req.params.itemId}, status=${req.body.status}`)
  try {
    const { status } = req.body
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const updatedItem = await saleService.updateSaleItemStatus(req.params.id as string, req.params.itemId as string, status, userId, ipAddress, userAgent)
    res.json(updatedItem)
  } catch (error: any) {
    next(error)
  }
})

router.patch('/:id/items/:itemId/quantity', async (req: Request, res: Response, next) => {
  try {
    const { quantity } = req.body
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const updatedItem = await saleService.updateSaleItemQuantity(req.params.id as string, req.params.itemId as string, quantity, userId, ipAddress, userAgent)
    res.json(updatedItem)
  } catch (error: any) {
    next(error)
  }
})

router.post('/', validate(saleCreateSchema), async (req: Request, res: Response, next) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const sale = await saleService.createSale(req.body, userId, ipAddress, userAgent)
    res.status(201).json(sale)
  } catch (error) {
    next(error)
  }
})

router.get('/', async (req: Request, res: Response, next) => {
  try {
    const status = req.query.status as string | undefined
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const result = await saleService.getAllSales({
      status,
      startDate,
      endDate,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    }, userId, ipAddress, userAgent)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

router.get('/summary', async (req: Request, res: Response, next) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const summary = await saleService.getSalesSummary({
      startDate,
      endDate,
    }, userId, ipAddress, userAgent)
    res.json(summary)
  } catch (error) {
    next(error)
  }
})

router.get('/recent', async (req: Request, res: Response, next) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const sales = await saleService.getRecentSales(parseInt(req.query.limit as string) || 10, userId, ipAddress, userAgent)
    res.json({ sales })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const sale = await saleService.getSaleById(req.params.id as string, userId, ipAddress, userAgent)
    res.json(sale)
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/status', async (req: Request, res: Response, next) => {
  console.log(`PATCH Status for sale ${req.params.id}:`, req.body)
  try {
    const { status, reason, financing } = req.body
    const userId = (req as any).user?.id // Extract userId from auth middleware
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const sale = await saleService.updateSaleStatus(req.params.id as string, status, userId, reason, financing, ipAddress, userAgent)
    res.json(sale)
  } catch (error) {
    next(error)
  }
})

router.post('/:id/accept-all', async (req: Request, res: Response, next) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const sale = await saleService.acceptAllItems(req.params.id as string, userId, ipAddress, userAgent)
    res.json(sale)
  } catch (error: any) {
    next(error)
  }
})

router.patch('/:id/delivery-status', async (req: Request, res: Response, next) => {
  console.log(`PATCH Delivery Status for sale ${req.params.id}:`, req.body)
  try {
    const { deliveryStatus, reason } = req.body
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const sale = await saleService.updateDeliveryStatus(req.params.id as string, deliveryStatus, userId, reason, ipAddress, userAgent)
    res.json(sale)
  } catch (error: any) {
    next(error)
  }
})

router.post('/:id/confirm-payment', async (req: Request, res: Response, next) => {
  try {
    const { amount, reason } = req.body
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    
    if (amount === undefined || amount === null) {
      throw new ValidationError('El monto es obligatorio')
    }

    const sale = await saleService.confirmPayment(req.params.id as string, Number(amount), userId, reason, ipAddress, userAgent)
    res.json(sale)
  } catch (error: any) {
    next(error)
  }
})

router.post('/:id/cancel', async (req: Request, res: Response, next) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const { reason } = req.body
    const sale = await saleService.cancelSale(req.params.id as string, userId, reason, ipAddress, userAgent)
    res.json(sale)
  } catch (error) {
    next(error)
  }
})

router.get('/bcv/current', async (req: Request, res: Response, next) => {
  try {
    const rate = await bcvService.getCurrentRate()
    res.json({ rate })
  } catch (error) {
    next(error)
  }
})

router.post('/bcv', async (req: Request, res: Response, next) => {
  try {
    const { rate, source } = req.body
    const bcvRecord = await bcvService.setRate(rate, source)
    res.status(201).json(bcvRecord)
  } catch (error) {
    next(error)
  }
})

router.get('/bcv/history', async (req: Request, res: Response, next) => {
  try {
    const { limit } = req.query
    const history = await bcvService.getRateHistory(parseInt(limit as string) || 50)
    res.json({ history })
  } catch (error) {
    next(error)
  }
})

export default router

