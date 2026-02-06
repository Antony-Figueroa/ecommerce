import { Router } from 'express'
import { cartService } from '../../../shared/container.js'
import { authenticate } from '../middleware/auth.middleware.js'

const router = Router()

// Todas las rutas de carrito requieren autenticación
router.use(authenticate)

router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })
    
    const cart = await cartService.getCart(userId)
    res.json(cart)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el carrito' })
  }
})

router.post('/items', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })
    
    const { productId, quantity } = req.body
    const cart = await cartService.addItem(userId, productId, quantity)
    res.json(cart)
  } catch (error) {
    res.status(500).json({ message: 'Error al añadir item al carrito' })
  }
})

router.patch('/items/:productId', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })
    
    const { productId } = req.params
    const { quantity } = req.body
    const cart = await cartService.updateQuantity(userId, productId, quantity)
    res.json(cart)
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar cantidad' })
  }
})

router.delete('/items/:productId', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })
    
    const { productId } = req.params
    const cart = await cartService.removeItem(userId, productId)
    res.json(cart)
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar item del carrito' })
  }
})

router.delete('/', async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ message: 'No autorizado' })
    
    const cart = await cartService.clearCart(userId)
    res.json(cart)
  } catch (error) {
    res.status(500).json({ message: 'Error al vaciar el carrito' })
  }
})

export default router
