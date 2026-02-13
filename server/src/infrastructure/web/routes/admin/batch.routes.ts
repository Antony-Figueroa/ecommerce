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
  } catch (error: any) {
    console.error('Error fetching batches:', error)
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

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const batch = await inventoryService.updateBatch(req.params.id as string, req.body, userId, ipAddress, userAgent)
    res.json(batch)
  } catch (error: any) {
    console.error('Error updating batch:', error)
    res.status(error.status || 500).json({ error: error.message || 'Error al actualizar lote' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    await inventoryService.deleteBatch(req.params.id as string, userId, ipAddress, userAgent)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting batch:', error)
    res.status(error.status || 500).json({ error: error.message || 'Error al eliminar lote' })
  }
})

export default router
