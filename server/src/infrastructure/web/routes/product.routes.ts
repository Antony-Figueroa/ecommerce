import { Router, Request, Response } from 'express'
import { inventoryService } from '../../../shared/container.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const { categoryId, categoryIds, search, page, limit } = req.query
    const result = await inventoryService.getAllProducts({
      categoryId: categoryId as string | null,
      categoryIds: categoryIds as string[] | null,
      search: search as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 20,
      onlyActive: true,
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

router.get('/public', async (req: Request, res: Response) => {
  try {
    const { 
      categoryId, 
      categoryIds, 
      search, 
      page, 
      limit,
      isFeatured, 
      isOffer,
      brand,
      minPrice,
      maxPrice,
      sortBy
    } = req.query
    
    const result = await inventoryService.getPublicProducts({
      categoryId: categoryId as string | null,
      categoryIds: categoryIds as string[] | null,
      search: search as string,
      page: parseInt(page as string) || 1,
      limit: parseInt(limit as string) || 12,
      isFeatured,
      isOffer,
      brand: brand as string | null,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      sortBy: (sortBy as string) || 'newest'
    })
    
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

router.get('/:id/related', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const limitQuery = req.query.limit
    const limit = typeof limitQuery === 'string' ? parseInt(limitQuery) : 4
    
    const product = await inventoryService.getProductById(id)
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }
    
    const categoryIds = product.categories?.map(c => c.id as string) || []
    if (categoryIds.length === 0) {
      return res.json({ products: [] })
    }
    
    const relatedProducts = await inventoryService.getRelatedProducts(
      id, 
      categoryIds, 
      limit
    )
    
    res.json({ products: relatedProducts })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos relacionados' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await inventoryService.getProductById(req.params.id as string)
    res.json(product)
  } catch (error) {
    if (error instanceof Error && error.message.includes('no encontrado')) {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: 'Error al obtener producto' })
  }
})

export default router
