import { Router, Request, Response } from 'express'
import { notificationService } from '../../../../shared/container.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

// Obtener todas las notificaciones de administrador
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const [notifications, total] = await Promise.all([
      notificationService.getAllNotifications(undefined, limit, skip),
      notificationService.countNotifications(undefined)
    ])

    res.json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    res.status(500).json({ error: 'Error al obtener notificaciones' })
  }
})

// Obtener notificaciones no leídas
router.get('/unread', async (_req: Request, res: Response) => {
  try {
    const notifications = await notificationService.getUnreadNotifications()
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones no leídas' })
  }
})

// Marcar una notificación como leída
router.post('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (typeof id !== 'string') {
      res.status(400).json({ error: 'ID de notificación inválido' })
      return
    }
    await notificationService.markAsRead(id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar notificación como leída' })
  }
})

// Marcar todas las notificaciones como leídas
router.post('/read-all', async (_req: Request, res: Response) => {
  try {
    await notificationService.markAllAsRead()
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar todas las notificaciones como leídas' })
  }
})

// Eliminar una notificación
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    if (typeof id !== 'string') {
      res.status(400).json({ error: 'ID de notificación inválido' })
      return
    }
    await notificationService.deleteNotification(id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar notificación' })
  }
})

export default router
