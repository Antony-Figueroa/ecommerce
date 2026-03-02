import { Router, Request, Response } from 'express'
import { productRepo, categoryRepo } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await categoryRepo.findAll({ includeInactive: true })
    
    const productsResult = await productRepo.findAll({ limit: 1000 })
    const products = Array.isArray(productsResult) ? productsResult : []
    
    const activeProducts = products
      .filter((p: any) => p.isActive)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        format: p.format,
        description: p.description,
        image: p.image,
        price: p.price,
        categoryId: Array.isArray(p.categoryIds) ? p.categoryIds[0] : null,
        category: categories.find(c => c.id === (Array.isArray(p.categoryIds) ? p.categoryIds[0] : null)) || null,
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
