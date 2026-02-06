import { Router, Request, Response } from 'express'
import { notificationService } from '../../../shared/container.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

// Obtener todas las notificaciones del usuario autenticado
router.get('/', async (req: any, res: Response) => {
  try {
    const userId = req.user.id
    const notifications = await notificationService.getAllNotifications(userId, 50)
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' })
  }
})

// Obtener notificaciones no leídas del usuario
router.get('/unread', async (req: any, res: Response) => {
  try {
    const userId = req.user.id
    const notifications = await notificationService.getUnreadNotifications(userId)
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones no leídas' })
  }
})

// Marcar una notificación como leída
router.post('/:id/read', async (req: any, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    
    // Verificar que la notificación pertenece al usuario
    const notifications = await notificationService.getUnreadNotifications(userId)
    const belongsToUser = notifications.some((n: any) => n.id === id)
    
    if (!belongsToUser) {
      // Si no está en unread, buscar en todas (esto es una simplificación)
      const all = await notificationService.getAllNotifications(userId, 100)
      if (!all.some((n: any) => n.id === id)) {
        return res.status(403).json({ error: 'No tienes permiso para modificar esta notificación' })
      }
    }

    await notificationService.markAsRead(id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar notificación como leída' })
  }
})

// Marcar todas las notificaciones como leídas
router.post('/read-all', async (req: any, res: Response) => {
  try {
    const userId = req.user.id
    await notificationService.markAllAsRead(userId)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar todas las notificaciones como leídas' })
  }
})

export default router
