import { Router, Request, Response } from 'express'
import { BCVService } from '../services/bcv.service.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const rate = await BCVService.getCurrentRate()
    res.json({ rate })
  } catch (error) {
    console.error('Error fetching BCV rate:', error)
    res.status(500).json({ error: 'Error al obtener tasa BCV' })
  }
})

export default router
