import { Router, Request, Response } from 'express'
import { inventoryService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate, batchCreateSchema } from '../../middleware/validation.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined
    const limit = parseInt(req.query.limit as string) || 100
    const batches = await inventoryService.getBatches({ search, limit })
    res.json({ batches })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener lotes' })
  }
})

router.post('/', validate(batchCreateSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const batch = await inventoryService.createBatch(req.body, userId, ipAddress, userAgent)
    res.status(201).json(batch)
  } catch (error) {
    if (error instanceof Error && error.message.includes('incompletos')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al crear lote' })
  }
})

export default router
