import { Router, Request, Response } from 'express'
import { businessEventService } from '../../../../shared/container.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate, authorize('ADMIN'))

// Obtener todos los eventos de negocio (calendario)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, userId, isFuture } = req.query
    
    const events = await businessEventService.getEvents({
      startDate: startDate as string,
      endDate: endDate as string,
      type: type as string,
      userId: userId as string,
      isFuture: isFuture === 'true' ? true : isFuture === 'false' ? false : undefined
    })

    res.json(events)
  } catch (error) {
    console.error('Error fetching business events:', error)
    res.status(500).json({ error: 'Error al obtener eventos del calendario' })
  }
})

// Crear un nuevo evento
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, title, description, date, amount, status, isFuture } = req.body
    
    if (!type || !title || !date) {
      return res.status(400).json({ error: 'Tipo, título y fecha son obligatorios' })
    }

    // Validar que la fecha no sea pasada
    const eventDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Si la fecha del evento (sin horas) es anterior a hoy (sin horas)
    const eventDateOnly = new Date(eventDate)
    eventDateOnly.setHours(0, 0, 0, 0)

    if (eventDateOnly < today) {
      return res.status(400).json({ error: 'No se pueden crear eventos para fechas pasadas' })
    }

    const event = await businessEventService.createEvent({
      type,
      title,
      description,
      date: new Date(date),
      amount: amount ? parseFloat(amount) : undefined,
      status,
      isFuture: isFuture === true || isFuture === 'true',
      userId: (req as any).user?.id
    })

    res.status(201).json(event)
  } catch (error) {
    console.error('Error creating business event:', error)
    res.status(500).json({ error: 'Error al crear evento' })
  }
})

// Actualizar un evento
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const updateData = req.body

    if (updateData.date) {
      updateData.date = new Date(updateData.date)
    }

    const event = await businessEventService.updateEvent(id, updateData)
    res.json(event)
  } catch (error) {
    console.error('Error updating business event:', error)
    res.status(500).json({ error: 'Error al actualizar evento' })
  }
})

// Eliminar un evento
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    await businessEventService.deleteEvent(id)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting business event:', error)
    res.status(500).json({ error: 'Error al eliminar evento' })
  }
})

// Endpoint para disparar manualmente el chequeo de alertas (útil para pruebas o cron)
router.post('/check-alerts', async (_req: Request, res: Response) => {
  try {
    const count = await businessEventService.checkPendingAlerts()
    res.json({ message: `Chequeo completado. ${count} alertas procesadas.` })
  } catch (error) {
    console.error('Error checking alerts:', error)
    res.status(500).json({ error: 'Error al procesar alertas' })
  }
})

export default router
