import { Router, Response } from 'express'
import { favoriteService } from '../../../shared/container.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// Obtener todos los favoritos del usuario
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const products = await favoriteService.getFavorites(userId)
    res.json({ favorites: products })
  } catch (error) {
    console.error('Error al obtener favoritos:', error)
    res.status(500).json({ error: 'Error al obtener favoritos' })
  }
})

// Verificar si un producto es favorito
router.get('/check/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const productId = req.params.productId as string

    const isFavorite = await favoriteService.checkFavorite(userId, productId)
    res.json({ isFavorite })
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar favorito' })
  }
})

// Agregar un producto a favoritos
router.post('/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const productId = req.params.productId as string

    const favorite = await favoriteService.addFavorite(userId, productId)
    res.status(201).json(favorite)
  } catch (error) {
    console.error('Error al agregar a favoritos:', error)
    res.status(500).json({ error: 'Error al agregar a favoritos' })
  }
})

// Eliminar un producto de favoritos
router.delete('/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const productId = req.params.productId as string

    await favoriteService.removeFavorite(userId, productId)
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error)
    res.status(500).json({ error: 'Error al eliminar de favoritos' })
  }
})

export default router

