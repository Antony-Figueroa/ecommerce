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

// Responder a una propuesta de pedido
router.post('/:id/respond-proposal', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const saleId = req.params.id as string
    const { status } = req.body

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Estado de respuesta inválido' })
    }

    const updatedSale = await saleService.respondToProposal(saleId, status, userId)
    res.json(updatedSale)
  } catch (error: any) {
    console.error('Error al responder a la propuesta:', error)
    const status = error.name === 'ValidationError' ? 400 : error.name === 'NotFoundError' ? 404 : 500
    res.status(status).json({ error: error.message || 'Error al procesar respuesta' })
  }
})

// Cancelar un pedido (por parte del cliente)
router.post('/:id/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const saleId = req.params.id as string
    const { reason } = req.body

    const sale = await saleService.getSaleById(saleId)
    
    // Verificar que el pedido pertenezca al usuario
    if (sale.userId !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar este pedido' })
    }

    const updatedSale = await saleService.cancelSale(saleId, userId, reason || 'Cancelado por el cliente')
    res.json(updatedSale)
  } catch (error: any) {
    console.error('Error al cancelar el pedido:', error)
    const status = error.name === 'ValidationError' ? 400 : error.name === 'NotFoundError' ? 404 : 500
    res.status(status).json({ error: error.message || 'Error al cancelar el pedido' })
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

