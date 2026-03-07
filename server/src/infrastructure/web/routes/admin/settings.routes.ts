import { Router, Request, Response } from 'express'
import { settingsService } from '../../../../shared/container.js'
import { googleDriveBackupService } from '../../../../application/services/google-drive-backup.service.js'
import { authenticate, authorize } from '../../middleware/auth.middleware.js'
import { validate } from '../../middleware/validation.middleware.js'
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
    const settings = await settingsService.getAllSettings()
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
    const results = await settingsService.updateSettings(req.body.updates, userId)
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
 * GET /api/admin/settings/backups
 * Lista todos los respaldos
 */
router.get('/backups', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const backups = await settingsService.listBackups(userId)
    res.json(backups)
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al listar respaldos' })
  }
})

/**
 * POST /api/admin/settings/backups
 * Crea un respaldo (sin contraseña requerida)
 */
router.post('/backups', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const backup = await settingsService.createBackup(userId)
    res.json(backup)
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al crear respaldo' })
  }
})

/**
 * POST /api/admin/settings/backups/restore
 * Restaura un respaldo (requiere mensaje de confirmación)
 */
router.post('/backups/restore', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { filename, confirmationMessage } = req.body
    
    console.log(`[BACKUP] Restore request for: ${filename}`)
    console.log(`[BACKUP] confirmationMessage received: "${confirmationMessage}"`)
    console.log(`[BACKUP] req.body:`, JSON.stringify(req.body))
    
    const result = await settingsService.restoreBackup(userId, filename, confirmationMessage)
    console.log(`[BACKUP] Restore result:`, result)
    
    res.json(result)
  } catch (error: any) {
    console.error('[BACKUP] Restore error:', error)
    res.status(error.status || 500).json({ error: error.message || 'Error al restaurar respaldo' })
  }
})

/**
 * DELETE /api/admin/settings/backups/:filename
 * Elimina un respaldo (requiere mensaje de confirmación)
 */
router.delete('/backups/:filename', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id as string
    const { filename } = req.params as { filename: string }
    const { confirmationMessage } = req.body
    const result = await settingsService.deleteBackup(userId, filename, confirmationMessage)
    res.json(result)
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al eliminar respaldo' })
  }
})

/**
 * GET /api/admin/settings/backups/remote
 * Lista los respaldos disponibles en Google Drive
 */
router.get('/backups/remote', async (_req: Request, res: Response) => {
  try {
    const backups = await googleDriveBackupService.listRemoteBackups()
    res.json(backups)
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al listar respaldos remotos' })
  }
})

/**
 * POST /api/admin/settings/backups/:filename/upload
 * Sube un respaldo local a Google Drive
 */
router.post('/backups/:filename/upload', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params as { filename: string }
    const result = await googleDriveBackupService.uploadBackup(filename)
    res.json(result)
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al subir respaldo' })
  }
})

/**
 * POST /api/admin/settings/backups/:filename/download
 * Descarga un respaldo desde Google Drive al servidor local
 */
router.post('/backups/:filename/download', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params as { filename: string }
    const result = await googleDriveBackupService.downloadBackup(filename)
    res.json(result)
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al descargar respaldo' })
  }
})

/**
 * POST /api/admin/settings/backups/remote/:filename/restore
 * Descarga y restaura un respaldo desde Google Drive (requiere mensaje de confirmación)
 */
router.post('/backups/remote/:filename/restore', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const { filename } = req.params as { filename: string }
    const { confirmationMessage } = req.body
    
    // Descargar desde Google Drive
    const downloadResult = await googleDriveBackupService.downloadBackup(filename)
    if (!downloadResult.success) {
      res.status(400).json({ error: downloadResult.message })
      return
    }
    
    // Restaurar el respaldo descargado (pide mensaje de confirmación)
    const restoreResult = await settingsService.restoreBackup(userId, filename, confirmationMessage)
    res.json({ 
      successMessage: 'Restaurado desde Google Drive',
      ...restoreResult
    })
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al restaurar desde Drive' })
  }
})

/**
 * GET /api/admin/settings/backups/google-drive/status
 * Verifica el estado de conexión con Google Drive
 */
router.get('/backups/google-drive/status', async (_req: Request, res: Response) => {
  res.json({ 
    configured: googleDriveBackupService.isConfigured 
  })
})

/**
 * GET /api/admin/settings/:key/history
 * Obtiene el historial de una configuración
 */
router.get('/:key/history', async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const history = await settingsService.getHistory(key as string)
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
    const result = await settingsService.revertSetting(historyId as string, userId)
    res.json({ message: 'Configuración revertida con éxito', result })
  } catch (error: any) {
    res.status(error.status || 500).json({ error: error.message || 'Error al revertir configuración' })
  }
})

export default router

