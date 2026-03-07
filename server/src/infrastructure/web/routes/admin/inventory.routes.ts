import { Router, Request, Response } from 'express'
import { inventoryLocationRepo, inventoryTransferRepo, inventoryStockRepo, productRepo } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/locations', async (_req: Request, res: Response) => {
  try {
    const locations = await inventoryLocationRepo.findAll()
    res.json({ locations })
  } catch (error) {
    console.error('Error in GET /locations:', error)
    import('fs').then(fs => fs.appendFileSync('server_errors.log', `[${new Date().toISOString()}] GET /locations: ${error instanceof Error ? error.stack : String(error)}\n`))
    res.status(500).json({ error: 'Error al obtener ubicaciones', message: error instanceof Error ? error.message : String(error) })
  }
})

router.post('/locations', async (req: Request, res: Response) => {
  try {
    const { name, description, address, isActive, isDefault } = req.body
    const location = await inventoryLocationRepo.create({ name, description, address, isActive: isActive ?? true, isDefault: isDefault ?? false })
    res.status(201).json(location)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ubicación' })
  }
})

router.put('/locations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const { name, description, address, isActive, isDefault } = req.body
    const location = await inventoryLocationRepo.update(id, { name, description, address, isActive, isDefault })
    res.json(location)
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ubicación' })
  }
})

router.delete('/locations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    await inventoryLocationRepo.delete(id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar ubicación' })
  }
})

router.get('/locations/:id/stock', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const stock = await inventoryStockRepo.findAll(id)
    res.json({ stock })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener stock' })
  }
})

router.get('/transfers', async (req: Request, res: Response) => {
  try {
    const { status } = req.query
    const transfers = await inventoryTransferRepo.findAll({ status: status as string })
    res.json({ transfers })
  } catch (error) {
    console.error('Error in GET /transfers:', error)
    import('fs').then(fs => fs.appendFileSync('server_errors.log', `[${new Date().toISOString()}] GET /transfers: ${error instanceof Error ? error.stack : String(error)}\n`))
    res.status(500).json({ error: 'Error al obtener transferencias', message: error instanceof Error ? error.message : String(error) })
  }
})

router.post('/transfers', async (req: Request, res: Response) => {
  try {
    const { fromLocationId, toLocationId, productId, quantity, notes } = req.body
    
    const fromStock = await inventoryStockRepo.findByProductAndLocation(productId, fromLocationId)
    if (!fromStock || fromStock.quantity < quantity) {
      return res.status(400).json({ error: 'Stock insuficiente en la ubicación de origen' })
    }

    await inventoryStockRepo.updateQuantity(fromStock.id, fromStock.quantity - quantity)
    
    const transfer = await inventoryTransferRepo.create({
      fromLocationId,
      toLocationId,
      productId,
      quantity,
      notes,
      status: 'PENDING'
    })
    
    res.status(201).json(transfer)
  } catch (error) {
    res.status(500).json({ error: 'Error al crear transferencia' })
  }
})

router.post('/transfers/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const transfer = await inventoryTransferRepo.complete(id)
    res.json(transfer)
  } catch (error) {
    res.status(500).json({ error: 'Error al completar transferencia' })
  }
})

router.post('/transfers/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string }
    const transfer = await inventoryTransferRepo.cancel(id)
    res.json(transfer)
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar transferencia' })
  }
})

export default router
