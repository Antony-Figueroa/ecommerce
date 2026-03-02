import { Router, Request, Response } from 'express'
import { productRepo, categoryRepo } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'
import { prisma } from '../../../persistence/prisma.client.js'

const router = Router()

router.use(authenticate)

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    })
    
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { 
        categories: true,
        images: { orderBy: { sortOrder: 'asc' }, take: 1 }
      },
      take: 1000,
    })
    
    const activeProducts = products
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        format: p.format,
        description: p.description,
        image: p.image || (p.images && p.images[0]?.url) || null,
        price: p.price,
        categoryId: (p.categories && p.categories[0]?.id) || null,
        category: (p.categories && p.categories[0]) || null,
        visible: p.catalogVisible !== false,
        order: p.catalogOrder || 0,
      }))
      .sort((a: any, b: any) => a.order - b.order)

    const categoriesWithCount = categories
      .filter((c: any) => activeProducts.some((p: any) => p.categoryId === c.id))
      .map((c: any) => ({
        ...c,
        productCount: activeProducts.filter((p: any) => p.categoryId === c.id).length
      }))

    res.json({
      products: activeProducts,
      categories: categoriesWithCount
    })
  } catch (error) {
    console.error('Error al obtener datos del catálogo:', error)
    res.status(500).json({ error: 'Error al obtener datos del catálogo' })
  }
})

router.put('/products/:id/visibility', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { visible } = req.body
    
    const product = await productRepo.findById(id)
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }
    
    await productRepo.update(id, { 
      catalogVisible: visible 
    })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error al actualizar visibilidad:', error)
    res.status(500).json({ error: 'Error al actualizar visibilidad' })
  }
})

router.put('/products/:id/order', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { order } = req.body
    
    const product = await productRepo.findById(id)
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }
    
    await productRepo.update(id, { 
      catalogOrder: order 
    })
    
    res.json({ success: true })
  } catch (error) {
    console.error('Error al actualizar orden:', error)
    res.status(500).json({ error: 'Error al actualizar orden' })
  }
})

export default router
