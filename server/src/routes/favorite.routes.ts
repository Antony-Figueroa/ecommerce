import { Router, Response } from 'express'
import { prisma as _prisma } from '../lib/prisma.js'
const prisma = _prisma as any
// Import validado post-generación de Prisma
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Obtener todos los favoritos del usuario
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    // Refresco de tipos de Prisma
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            category: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json({ favorites: favorites.map((f: any) => f.product) })
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

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })

    res.json({ isFavorite: !!favorite })
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar favorito' })
  }
})

// Agregar un producto a favoritos
router.post('/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id
    const productId = req.params.productId as string

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId,
          productId
        }
      },
      update: {},
      create: {
        userId,
        productId
      }
    })

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

    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar de favoritos:', error)
    res.status(500).json({ error: 'Error al eliminar de favoritos' })
  }
})

export default router
