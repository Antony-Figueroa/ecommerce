import { Router, Request, Response } from 'express'
import { dashboardService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const stats = await dashboardService.getAdminStats(startDate, endDate)
    res.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

export default router

