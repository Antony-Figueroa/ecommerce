import { Router, Request, Response } from 'express'
import { bcvService, bcvUpdaterService } from '../../../../shared/container.js'

const router = Router()

// Obtener estado actual e historial de tasas
router.get('/status', async (_req: Request, res: Response) => {
  try {
    let currentRate = await bcvService.getLatestRateRecord()
    
    // Si no hay tasa activa, intentar actualizar automáticamente
    if (!currentRate) {
      console.log('No se encontró tasa activa, intentando actualización automática...')
      try {
        await bcvUpdaterService.updateRate()
        currentRate = await bcvService.getLatestRateRecord()
      } catch (updateError) {
        console.error('Error en actualización automática de BCV:', updateError)
      }
    }
    
    const history = await bcvService.getRateHistory(20)
    
    res.json({
      currentRate,
      history,
    })
  } catch (error) {
    console.error('Error fetching BCV status:', error)
    res.status(500).json({ error: 'Error al obtener estado de BCV' })
  }
})

// Forzar actualización manual
router.post('/update', async (_req: Request, res: Response) => {
  try {
    await bcvUpdaterService.updateRate()
    const newRateRecord = await bcvService.getLatestRateRecord()
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
    
    const userId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')
    
    const newRecord = await bcvService.setRate(parseFloat(rate), 'manual-admin', userId, ipAddress, userAgent)
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

