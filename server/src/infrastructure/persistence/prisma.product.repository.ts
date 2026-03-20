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
    isActive?: boolean
    isFeatured?: boolean
    isOffer?: boolean
    brand?: string | null
    minPrice?: number
    maxPrice?: number
    sortBy?: 'popular' | 'newest' | 'price-low' | 'price-high'
    includeCount?: boolean
  }) {
    const { 
      categoryId = null, 
      categoryIds = null, 
      search = '', 
      page = 1, 
      limit = 20, 
      onlyActive = true,
      isActive = undefined,
      isFeatured = undefined,
      isOffer = undefined,
      brand = null,
      minPrice = undefined,
      maxPrice = undefined,
      sortBy = 'newest',
      includeCount = false
    } = options

    const where: any = {}
    
    const allCategoryIds = [...(categoryIds || [])]
    if (categoryId) allCategoryIds.push(categoryId)

    if (allCategoryIds.length > 0) {
      where.categories = {
        some: {
          id: { in: allCategoryIds }
        }
      }
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive
    } else if (onlyActive) {
      where.isActive = true
    }
    if (isFeatured !== undefined) where.isFeatured = isFeatured
    if (isOffer !== undefined) where.isOffer = isOffer
    if (brand) where.brand = brand
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice
      if (maxPrice !== undefined) where.price.lte = maxPrice
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sortBy === 'price-low') orderBy = { price: 'asc' }
    else if (sortBy === 'price-high') orderBy = { price: 'desc' }
    else if (sortBy === 'newest') orderBy = { createdAt: 'desc' }

    const include: any = { 
      categories: true,
      images: {
        orderBy: { sortOrder: 'asc' }
      }
    }

    if (includeCount) {
      include._count = {
        select: {
          batches: true,
          inventoryBatchItems: true,
          saleItems: true,
          cartItems: true,
          favorites: true,
          requirementItems: true
        }
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return { products, total }
  }

  async findRelated(productId: string, categoryIds: string[], limit = 4) {
    const excludeIds = [productId]
    
    return prisma.product.findMany({
      where: {
        isActive: true,
        id: { notIn: excludeIds },
        categories: {
          some: {
            id: { in: categoryIds }
          }
        }
      },
      include: { 
        categories: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
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

  async findByProductCode(productCode: string) {
    return prisma.product.findFirst({
      where: { productCode },
    })
  }

  async create(data: any, tx?: any) {
    const client = tx || prisma
    return client.product.create({
      data,
      include: { 
        categories: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
    })
  }

  async update(id: string, data: any, tx?: any) {
    const client = tx || prisma
    return client.product.update({
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

  async delete(id: string, tx?: any) {
    const client = tx || prisma
    return client.product.delete({
      where: { id },
      include: { 
        categories: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
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

  async deleteImages(productId: string, tx?: any) {
    const client = tx || prisma
    await client.productImage.deleteMany({ where: { productId } })
  }
}
