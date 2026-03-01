import { Router, Response, Request } from 'express'
import { saleService, paymentService } from '../../../shared/container.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// Public routes for proposal confirmation (no authentication required)
router.get('/confirm/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string
    const sale = await saleService.getSaleByToken(token)
    res.json(sale)
  } catch (error: any) {
    console.error('Error al obtener pedido por token:', error)
    const status = error.name === 'ValidationError' ? 400 : error.name === 'NotFoundError' ? 404 : 500
    res.status(status).json({ error: error.message || 'Error al obtener pedido' })
  }
})

router.post('/confirm/:token/respond', async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string
    const { response, reason } = req.body

    if (!['ACCEPT', 'REJECT'].includes(response)) {
      return res.status(400).json({ error: 'Respuesta inválida' })
    }

    const updatedSale = await saleService.respondToProposal(token, response, undefined, reason)
    res.json(updatedSale)
  } catch (error: any) {
    console.error('Error al responder a propuesta por token:', error)
    const status = error.name === 'ValidationError' ? 400 : error.name === 'NotFoundError' ? 404 : 500
    res.status(status).json({ error: error.message || 'Error al procesar respuesta' })
  }
})

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

    // Incluir estado de pagos e instalamentos
    const paymentStatus = await paymentService.getPaymentStatus(saleId)
    
    res.json({
      ...sale,
      paymentStatus
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al obtener detalle del pedido' })
  }
})

// Subir comprobante de pago
router.post('/installments/:installmentId/proof', async (req: AuthRequest, res: Response) => {
  try {
    const installmentId = req.params.installmentId as string
    const { proofUrl, amountUSD, notes } = req.body

    const proof = await paymentService.submitPaymentProof({
      installmentId,
      proofUrl,
      amountUSD: Number(amountUSD),
      notes
    })

    res.status(201).json(proof)
  } catch (error: any) {
    console.error('Error al subir comprobante:', error)
    const status = error.name === 'ValidationError' ? 400 : error.name === 'NotFoundError' ? 404 : 500
    res.status(status).json({ error: error.message || 'Error al procesar comprobante' })
  }
})

// Responder a una propuesta de pedido
router.post('/:id/respond-proposal', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const saleId = req.params.id as string
    const { status, reason } = req.body

    const responseLabel = status === 'ACCEPTED' ? 'ACCEPT' : status === 'REJECTED' ? 'REJECT' : null
    if (!responseLabel) {
      return res.status(400).json({ error: 'Estado de respuesta inválido' })
    }

    const updatedSale = await saleService.respondToProposal(saleId, responseLabel, userId, reason)
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

