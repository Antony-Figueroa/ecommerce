import { Router, Request, Response } from 'express'
import { BCVService } from '../../services/bcv.service.js'
import { BCVUpdaterService } from '../../services/bcv-updater.service.js'
import { prisma } from '../../lib/prisma.js'

const router = Router()

// Obtener estado actual e historial de tasas
router.get('/status', async (_req: Request, res: Response) => {
  try {
    let currentRate = await BCVService.getLatestRateRecord()
    
    // Si no hay tasa activa, intentar actualizar automáticamente
    if (!currentRate) {
      console.log('No se encontró tasa activa, intentando actualización automática...')
      try {
        await BCVUpdaterService.updateRate()
        currentRate = await BCVService.getLatestRateRecord()
      } catch (updateError) {
        console.error('Error en actualización automática de BCV:', updateError)
      }
    }
    
    const history = await prisma.bCVRate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    
    res.json({
      currentRate,
      history,
    })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estado de BCV' })
  }
})

// Forzar actualización manual
router.post('/update', async (_req: Request, res: Response) => {
  try {
    await BCVUpdaterService.updateRate()
    const newRateRecord = await BCVService.getLatestRateRecord()
    res.json({ 
      message: 'Actualización completada', 
      rate: newRateRecord?.rate || 0,
      record: newRateRecord 
    })
  } catch (error) {
    console.error('Error en /api/admin/bcv/update:', error)
    const message = error instanceof Error ? error.message : 'Error al forzar actualización de BCV'
    res.status(500).json({ error: message })
  }
})

// Establecer tasa manualmente
router.post('/manual', async (req: Request, res: Response) => {
  try {
    const { rate } = req.body
    if (!rate || isNaN(parseFloat(rate))) {
      return res.status(400).json({ error: 'Tasa inválida' })
    }
    
    const newRecord = await BCVService.setRate(parseFloat(rate), 'manual-admin')
    res.json({ 
      message: 'Tasa actualizada manualmente', 
      rate: newRecord.rate,
      record: newRecord 
    })
  } catch (error) {
    console.error('Error en /api/admin/bcv/manual:', error)
    res.status(500).json({ error: 'Error al actualizar tasa manualmente' })
  }
})

export default router
