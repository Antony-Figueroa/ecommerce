import { Router } from 'express'
import { sheetsSyncService } from '../../../application/services/sheets-sync.service.js'
import { authenticate } from '../middleware/auth.middleware.js'
import { AuthenticationError } from '../../../shared/errors/app.errors.js'

const router = Router()

router.get('/status', async (_req, res, next) => {
  try {
    const status = sheetsSyncService.getStatus()
    res.json({
      success: true,
      ...status,
      configured: !!process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SHEET_ID !== 'YOUR_SHEET_ID_HERE'
    })
  } catch (error) {
    next(error)
  }
})

router.post('/force-sync', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      throw new AuthenticationError('Solo administradores pueden forzar sincronización')
    }

    const status = await sheetsSyncService.forceSync()
    res.json({
      success: true,
      message: 'Sincronización completada',
      ...status
    })
  } catch (error) {
    next(error)
  }
})

router.post('/sheet-update', async (req, res, next) => {
  try {
    const { sku, stock, editedBy } = req.body

    if (!sku || stock === undefined) {
      res.status(400).json({
        success: false,
        error: 'Se requieren SKU y stock'
      })
      return
    }

    const result = await sheetsSyncService.processSheetStockUpdate(
      sku,
      parseInt(stock),
      editedBy || 'Google Sheets'
    )

    res.json({
      success: true,
      message: 'Stock actualizado correctamente',
      ...result
    })
  } catch (error) {
    next(error)
  }
})

export default router
