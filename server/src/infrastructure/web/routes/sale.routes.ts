import { Router, Response } from 'express'
import { saleService } from '../../../shared/container.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

// Obtener pedidos del usuario autenticado
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = await saleService.getSalesByUserId(userId, { page, limit })
    res.json(result)
  } catch (error) {
    console.error('Error al obtener pedidos del usuario:', error)
    res.status(500).json({ error: 'Error al obtener pedidos' })
  }
})

// Obtener detalle de un pedido específico
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const saleId = req.params.id as string

    const sale = await saleService.getSaleById(saleId)
    
    // Verificar que el pedido pertenezca al usuario
    if (sale.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este pedido' })
    }

    res.json(sale)
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al obtener detalle del pedido' })
  }
})

// Generar factura PDF
router.get('/:id/invoice', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const saleId = req.params.id as string

    const sale = await saleService.getSaleById(saleId)
    
    // Verificar que el pedido pertenezca al usuario o sea admin
    if (sale.userId !== userId && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No tienes permiso para ver esta factura' })
    }

    const pdfBuffer = await saleService.generateInvoicePDF(saleId)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=factura-${sale.saleNumber}.pdf`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error al generar factura:', error)
    res.status(500).json({ error: 'Error al generar la factura' })
  }
})

export default router

