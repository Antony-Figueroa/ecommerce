import { Router, Request, Response } from 'express'
import { categoryRepo } from '../../../shared/container.js'

const router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await categoryRepo.findAll({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    })

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      icon: cat.icon,
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
      productCount: cat._count?.products || 0,
    }))

    res.json({ categories: result })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug

    const category = await categoryRepo.findFirst({
      where: { slug, isActive: true },
      include: { products: { where: { isActive: true } } },
    })

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    res.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    res.status(500).json({ error: 'Error al obtener categoría' })
  }
})

export default router

