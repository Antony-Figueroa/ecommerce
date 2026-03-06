import { Router, Request, Response } from 'express'
import { categoryRepo, productRepo } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.post('/seed', async (_req: Request, res: Response) => {
  try {
    const predefinedCategories = [
      { name: 'Vitaminas y Suplementos', icon: '💊', description: 'Multivitamínicos, minerales y suplementos nutricionales' },
      { name: 'Analgésicos', icon: '🩹', description: 'Alivio del dolor y reducción de fiebre' },
      { name: 'Antibióticos', icon: '💉', description: 'Tratamiento de infecciones bacterianas' },
      { name: 'Cuidado Personal', icon: '🧴', description: 'Higiene, cuidado de la piel y el cabello' },
      { name: 'Primeros Auxilios', icon: '🚑', description: 'Material de curación y emergencias' },
      { name: 'Infantil y Maternidad', icon: '🍼', description: 'Productos para bebés y cuidado materno' },
      { name: 'Salud Digestiva', icon: '🍵', description: 'Antiácidos, laxantes y probióticos' },
      { name: 'Equipos Médicos', icon: '🩺', description: 'Tensiómetros, termómetros y nebulizadores' },
      { name: 'Deporte y Energía', icon: '⚡', description: 'Proteínas, creatinas y pre-entrenos' },
      { name: 'Bienestar Natural', icon: '🌿', description: 'Hierbas, aceites esenciales y medicina natural' },
      { name: 'Dermocosmética', icon: '✨', description: 'Cuidado avanzado de la piel y estética' },
      { name: 'Salud Cardiovascular', icon: '❤️', description: 'Suplementos y equipos para el corazón' },
      { name: 'Diabetes', icon: '🩸', description: 'Insumos y suplementos para control de azúcar' }
    ]

    const created: any[] = []
    for (const cat of predefinedCategories) {
      const slug = cat.name.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')

      // Usar upsert para evitar duplicados si ya existen por slug
      const upsertedCategory = await categoryRepo.upsert(slug, {
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        isActive: true,
        sortOrder: created.length
      })
      created.push(upsertedCategory)
    }

    res.json({ message: 'Categorías sembradas con éxito', count: created.length, categories: created })
  } catch (error) {
    console.error('Error seeding categories:', error)
    res.status(500).json({ error: 'Error al sembrar categorías' })
  }
})

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await categoryRepo.findAll({
      orderBy: { sortOrder: 'asc' },
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
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }))

    res.json({ categories: result })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, image, icon, isActive, sortOrder } = req.body

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    const existing = await categoryRepo.findBySlug(slug)
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una categoría con este nombre' })
    }

    const category = await categoryRepo.create({
      name,
      slug,
      description: description || null,
      image: image || null,
      icon: icon || null,
      isActive: isActive ?? true,
      sortOrder: sortOrder || 0,
    })

    res.status(201).json(category)
  } catch (error) {
    console.error('Error creating category:', error)
    res.status(500).json({ error: 'Error al crear categoría' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const category = await categoryRepo.findById(id)

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }

    const result = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      icon: category.icon,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      productCount: category._count?.products || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }

    res.json(result)
  } catch (error) {
    console.error('Error fetching category:', error)
    res.status(500).json({ error: 'Error al obtener categoría' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, image, icon, isActive, sortOrder } = req.body
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const updateData: Record<string, unknown> = {
      description: description ?? null,
      image: image ?? null,
      icon: icon ?? null,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    }

    if (name) {
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      updateData.name = name
      updateData.slug = slug
    }

    const category = await categoryRepo.update(id, updateData)

    res.json(category)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }
    console.error('Error updating category:', error)
    res.status(500).json({ error: 'Error al actualizar categoría' })
  }
})

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { isActive, sortOrder } = req.body
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const updateData: Record<string, unknown> = {}
    if (typeof isActive === 'boolean') updateData.isActive = isActive
    if (typeof sortOrder === 'number') updateData.sortOrder = sortOrder

    const category = await categoryRepo.update(id, updateData)

    res.json(category)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }
    console.error('Error patching category:', error)
    res.status(500).json({ error: 'Error al actualizar categoría' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    // Products use a many-to-many relation with categories (no direct categoryId field)
    const productsCount = await productRepo.count({
      categories: {
        some: { id }
      }
    })

    if (productsCount > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar la categoría porque tiene productos asociados. Por favor, mueva o elimine los productos primero.',
        productCount: productsCount,
      })
    }

    // Borrado lógico
    await categoryRepo.update(id, { isActive: false })

    res.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }
    console.error('Error deleting category:', error)
    res.status(500).json({ error: 'Error al eliminar categoría' })
  }
})

export default router

