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

router.get('/audit', async (req: Request, res: Response) => {
  try {
    const options = {
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId as string | undefined,
      action: req.query.action as string | undefined,
      userId: req.query.userId as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      page: req.query.page ? parseInt(req.query.page as string) : 1
    }
    
    const logs = await dashboardService.getAuditLogs(options)
    res.json(logs)
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    res.status(500).json({ 
      error: 'Error al obtener logs de auditoría',
      message: error.message
    })
  }
})

export default router

