import { Router, Request, Response } from 'express'
import { inventoryService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate, providerCreateSchema, providerUpdateSchema } from '../../middleware/validation.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', async (_req: Request, res: Response) => {
  try {
    const providers = await inventoryService.getProviders()
    res.json({ providers })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener proveedores' })
  }
})

router.post('/', validate(providerCreateSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const provider = await inventoryService.createProvider(req.body, userId, ipAddress, userAgent)
    res.status(201).json(provider)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear proveedor' })
  }
})

router.put('/:id', validate(providerUpdateSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const provider = await inventoryService.updateProvider(id, req.body, userId, ipAddress, userAgent)
    res.json(provider)
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al actualizar proveedor' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    await inventoryService.deleteProvider(id, userId, ipAddress, userAgent)
    res.status(204).send()
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al eliminar proveedor' })
  }
})

export default router
