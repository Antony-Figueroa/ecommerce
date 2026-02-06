import { Router, Request, Response, NextFunction } from 'express'
import { bcvService, bcvUpdaterService } from '../../../shared/container.js'

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    let rate = await bcvService.getCurrentRate()
    
    // Si la tasa es 0 o no existe, intentar actualizar automáticamente
    if (!rate || rate === 0) {
      console.log('Tasa BCV no disponible en ruta pública, intentando actualización...')
      try {
        await bcvUpdaterService.updateRate()
        rate = await bcvService.getCurrentRate()
      } catch (updateError) {
        console.error('Error en actualización automática de BCV (pública):', updateError)
      }
    }

    res.json({ rate })
  } catch (error) {
    next(error)
  }
})

export default router

