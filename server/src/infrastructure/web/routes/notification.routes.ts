import { Router, Request, Response } from 'express'
import { notificationService, notificationSettingService } from '../../../shared/container.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

// Obtener todas las notificaciones del usuario autenticado con filtros
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { category, limit, skip } = req.query
    const notifications = await notificationService.getAllNotifications(
      userId, 
      category as string,
      limit ? parseInt(limit as string) : 50,
      skip ? parseInt(skip as string) : 0
    )
    res.json(notifications)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener notificaciones' })
  }
})

// Obtener conteo de notificaciones no leídas
router.get('/unread/count', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const { category } = req.query
    const count = await notificationService.countNotifications(userId, category as string)
    res.json({ count })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener conteo de notificaciones' })
  }
})

// Obtener notificaciones no leídas del usuario
router.get('/unread', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const notifications = await notificationService.getUnreadNotifications(userId)
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
      return res.status(400).json({ error: 'ID inválido' })
    }
    const userId = req.user!.id
    
    // Verificar que la notificación pertenece al usuario
    const notifications = await notificationService.getUnreadNotifications(userId)
    const belongsToUser = notifications.some((n: any) => n.id === id)
    
    if (!belongsToUser) {
      // Si no está en unread, buscar en todas (esto es una simplificación)
      const all = await notificationService.getAllNotifications(userId, undefined, 100)
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
router.post('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    await notificationService.markAllAsRead(userId)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar todas las notificaciones como leídas' })
  }
})

// Obtener configuración de notificaciones
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const settings = await notificationSettingService.getSettings(userId)
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración de notificaciones' })
  }
})

// Actualizar configuración de notificaciones
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const settings = await notificationSettingService.updateSettings(userId, req.body)
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración de notificaciones' })
  }
})

export default router
