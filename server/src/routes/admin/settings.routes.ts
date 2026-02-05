import { Router, Request, Response } from 'express'
import { SettingsService } from '../../services/settings.service.js'
import { authenticate, authorize } from '../../middleware/auth.js'
import { validate } from '../../middleware/validation.js'
import { z } from 'zod'

const router = Router()

// Esquema de validación para actualización masiva
const updateBulkSchema = z.object({
  updates: z.array(z.object({
    key: z.string(),
    value: z.any().transform(val => String(val)),
    reason: z.string().optional()
  })).min(1)
})

router.use(authenticate)
router.use(authorize('ADMIN'))

/**
 * GET /api/admin/settings
 * Obtiene todas las configuraciones agrupadas
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const settings = await SettingsService.getAllSettings()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuraciones' })
  }
})

/**
 * PATCH /api/admin/settings
 * Actualiza múltiples configuraciones con auditoría
 */
router.patch('/', validate(updateBulkSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const results = await SettingsService.updateSettings(req.body.updates, userId)
    res.json({ 
      message: 'Configuraciones actualizadas con éxito',
      count: results.length,
      results 
    })
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al actualizar configuraciones' })
  }
})

/**
 * GET /api/admin/settings/:key/history
 * Obtiene el historial de una configuración
 */
router.get('/:key/history', async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const history = await SettingsService.getHistory(key as string)
    res.json(history)
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al obtener historial' })
  }
})

/**
 * POST /api/admin/settings/revert/:historyId
 * Revierte una configuración a un valor anterior
 */
router.post('/revert/:historyId', async (req: Request, res: Response) => {
  try {
    const { historyId } = req.params
    const userId = (req as any).user.id
    const result = await SettingsService.revertSetting(historyId as string, userId)
    res.json({ message: 'Configuración revertida con éxito', result })
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al revertir configuración' })
  }
})

export default router
