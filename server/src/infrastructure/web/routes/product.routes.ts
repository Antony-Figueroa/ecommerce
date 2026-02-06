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
    const { categoryId, categoryIds, search } = req.query
    const products = await inventoryService.getPublicProducts({
      categoryId: categoryId as string | null,
      categoryIds: categoryIds as string[] | null,
      search: search as string,
    })
    res.json({ products })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' })
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

