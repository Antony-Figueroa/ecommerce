import { Router, Request, Response } from 'express'
import { inventoryService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate, providerCreateSchema } from '../../middleware/validation.middleware.js'

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

export default router
