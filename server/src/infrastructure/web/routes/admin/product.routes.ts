import { Router, Request, Response } from 'express'
import { inventoryService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate, productCreateSchema, productUpdateSchema } from '../../middleware/validation.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/brands', async (_req: Request, res: Response) => {
  try {
    const brands = await inventoryService.getAllBrands()
    res.json(brands)
  } catch (error) {
    console.error('Error al obtener marcas:', error)
    res.status(500).json({ error: 'Error al obtener marcas' })
  }
})

router.get('/inventory-report', async (req: Request, res: Response) => {
  try {
    const report = await inventoryService.getInventoryReport()
    res.json(report)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener reporte de inventario' })
  }
})

router.get('/inventory-logs', async (req: Request, res: Response) => {
  try {
    const productId = req.query.productId as string | undefined
    const logs = await inventoryService.getInventoryLogs(
      productId || null,
      parseInt(req.query.limit as string) || 50
    )
    res.json({ logs })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener logs de inventario' })
  }
})

router.post('/', validate(productCreateSchema), async (req: Request, res: Response, next) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const product = await inventoryService.createProduct(req.body, userId, ipAddress, userAgent)
    res.status(201).json(product)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', validate(productUpdateSchema), async (req: Request, res: Response, next) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const product = await inventoryService.updateProduct(req.params.id as string, req.body, userId, ipAddress, userAgent)
    res.json(product)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    await inventoryService.deleteProduct(req.params.id as string, userId, ipAddress, userAgent)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const categoryId = req.query.categoryId as string | undefined
    const categoryIds = req.query.categoryIds as string[] | undefined
    const search = req.query.search as string | undefined
    const isActiveQuery = req.query.isActive as string | undefined
    
    const result = await inventoryService.getAllProducts({
      categoryId: categoryId || null,
      categoryIds: categoryIds || null,
      search: search || '',
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      onlyActive: req.query.onlyActive === 'true',
      isActive: isActiveQuery === 'true' ? true : (isActiveQuery === 'false' ? false : undefined),
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

export default router

