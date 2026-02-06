import { Router } from 'express'
import { settingsService } from '../../../shared/container.js'

const router = Router()

/**
 * GET /api/settings/public
 * Obtiene las configuraciones públicas para el frontend
 */
router.get('/public', async (_req, res, next) => {
  try {
    const publicSettings = await settingsService.getPublicSettings()
    res.json(publicSettings)
  } catch (error) {
    next(error)
  }
})

export default router
