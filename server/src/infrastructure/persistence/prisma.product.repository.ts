import { prisma } from './prisma.client.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'

export class PrismaProductRepository implements ProductRepository {
  async findAll(options: {
    categoryId?: string | null
    categoryIds?: string[] | null
    search?: string
    page?: number
    limit?: number
    onlyActive?: boolean
  }) {
    const { categoryId = null, categoryIds = null, search = '', page = 1, limit = 20, onlyActive = false } = options

    const where: any = {}
    
    // Combinar categoryId y categoryIds
    const allCategoryIds = [...(categoryIds || [])]
    if (categoryId) allCategoryIds.push(categoryId)

    if (allCategoryIds.length > 0) {
      where.categories = {
        some: {
          id: { in: allCategoryIds }
        }
      }
    }
    if (onlyActive) where.isActive = true
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } },
      ]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { 
          categories: true,
          images: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return { products, total }
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { 
        categories: true, 
        batches: {
          orderBy: { createdAt: 'desc' }
        },
        priceHistory: {
          orderBy: { createdAt: 'desc' }
        },
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
    })
  }

  async findBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
    })
  }

  async create(data: any) {
    return prisma.product.create({
      data,
      include: { 
        categories: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
    })
  }

  async update(id: string, data: any) {
    return prisma.product.update({
      where: { id },
      data,
      include: { 
        categories: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
    })
  }

  async delete(id: string) {
    await prisma.product.delete({
      where: { id },
    })
  }

  async getAllBrands() {
    const brands = await prisma.product.findMany({
      select: { brand: true },
      distinct: ['brand'],
      where: { brand: { not: "" } },
    })
    return brands.map(b => b.brand as string).filter(Boolean)
  }

  async findMany(options: any) {
    return prisma.product.findMany(options)
  }

  async findLowStock() {
    return prisma.product.findMany({
      where: {
        stock: { lte: prisma.product.fields.minStock },
        isActive: true,
      },
    })
  }

  async count(where: any) {
    return prisma.product.count({ where })
  }

  async deleteImages(productId: string) {
    await prisma.productImage.deleteMany({ where: { productId } })
  }
}
