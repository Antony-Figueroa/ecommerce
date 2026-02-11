import { Router, Request, Response } from 'express'
import { requirementService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { validate, requirementCreateSchema } from '../../middleware/validation.middleware.js'

const router = Router()

router.use(authenticate)

router.post('/', validate(requirementCreateSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const requirement = await requirementService.createRequirement(req.body, userId, ipAddress, userAgent)
    res.status(201).json(requirement)
  } catch (error) {
    if (error instanceof Error && error.message.includes('inválido')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al crear requerimiento' })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined
    const supplier = req.query.supplier as string | undefined
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const result = await requirementService.getAllRequirements({
      status,
      supplier,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    }, userId, ipAddress, userAgent)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener requerimientos' })
  }
})

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const summary = await requirementService.getRequirementsSummary(userId, ipAddress, userAgent)
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener resumen' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const requirement = await requirementService.getRequirementById(req.params.id as string, userId, ipAddress, userAgent)
    res.json(requirement)
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al obtener requerimiento' })
  }
})

router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const requirement = await requirementService.updateRequirementStatus(req.params.id as string, status, userId, ipAddress, userAgent)
    res.json(requirement)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message })
      }
      if (error.message.includes('inválido') || error.message.includes('solo')) {
        return res.status(400).json({ error: error.message })
      }
    }
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
})

router.post('/:id/receive', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const requirement = await requirementService.updateRequirementStatus(req.params.id as string, 'RECEIVED', userId, ipAddress, userAgent)
    res.json(requirement)
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al recibir requerimiento' })
  }
})

router.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const requirement = await requirementService.updateRequirementStatus(req.params.id as string, 'CANCELLED', userId, ipAddress, userAgent)
    res.json(requirement)
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al cancelar requerimiento' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    await requirementService.deleteRequirement(req.params.id as string, userId, ipAddress, userAgent)
    res.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    if (error instanceof Error && error.message.includes('solo')) {
      return res.status(400).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al eliminar requerimiento' })
  }
})

export default router

