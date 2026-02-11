import { Router, Request, Response } from 'express'
import { dashboardService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    const stats = await dashboardService.getAdminStats(startDate, endDate, userId, ipAddress, userAgent)
    res.json(stats)
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ 
      error: 'Error al obtener estadísticas',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

export default router

