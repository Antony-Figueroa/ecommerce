import { prisma } from '../lib/prisma.js'
import { NotFoundError, ValidationError } from '../utils/errors.js'

export class InventoryService {
  static async updatePricesByBCV(newRate: number, previousRate: number) {
    if (previousRate <= 0) return

    const ratio = newRate / previousRate
    const products = await prisma.product.findMany({
      where: { currency: 'BS' }
    })

    for (const product of products) {
      const currentPrice = Number(product.price)
      const newPrice = currentPrice * ratio
      
      await prisma.product.update({
        where: { id: product.id },
        data: { price: newPrice }
      })
    }
  }

  private static calculatePrice(purchasePrice: number, shippingCost: number, margin: number): number {
    return (Number(purchasePrice) + Number(shippingCost)) * Number(margin)
  }

  private static async generateSKU(name: string, categoryId: string): Promise<string> {
    // Obtener las primeras 3 letras de la categoría
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true }
    })
    
    const categoryPrefix = (category?.name || 'GEN').substring(0, 3).toUpperCase()
    
    // Obtener las primeras 3 letras del nombre del producto
    const namePrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    
    // Generar un número secuencial basado en el conteo total de productos
    const count = await prisma.product.count()
    const sequence = (count + 1).toString().padStart(4, '0')
    
    // Formato: CAT-NOM-0001
    const sku = `${categoryPrefix}-${namePrefix}-${sequence}`
    
    // Verificar si ya existe (por si acaso hubo eliminaciones)
    const existing = await prisma.product.findUnique({ where: { sku } })
    if (existing) {
      // Si existe, añadir un sufijo aleatorio
      return `${sku}-${Math.floor(Math.random() * 1000)}`
    }
    
    return sku
  }

  static async getAllBrands() {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    return brands.map(b => b.name)
  }

  private static async getOrCreateBrand(name: string): Promise<string> {
    const brand = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name }
    })
    return brand.id
  }

  static async createProduct(data: {
    sku?: string
    name: string
    description: string
    price?: number
    image?: string | null
    images?: Array<{
      url: string
      thumbnail?: string
      medium?: string
      large?: string
      isMain?: boolean
      sortOrder?: number
    }>
    categoryId: string
    brand: string
    format: string
    weight?: string | null
    purchasePrice: number
    shippingCost: number
    profitMargin: number
    stock: number
    minStock?: number
  }) {
    let sku = data.sku
    if (!sku || sku.trim() === '') {
      sku = await this.generateSKU(data.name, data.categoryId)
    }

    const existingSku = await prisma.product.findUnique({ where: { sku } })
    if (existingSku) {
      throw new ValidationError('Ya existe un producto con este SKU')
    }

    const finalPrice = data.price || this.calculatePrice(data.purchasePrice, data.shippingCost, data.profitMargin)

    // Use the first image as the main image if provided
    const mainImageUrl = data.images && data.images.length > 0 
      ? data.images.find(img => img.isMain)?.url || data.images[0].url 
      : data.image

    const brandId = await this.getOrCreateBrand(data.brand)

    const product = await prisma.product.create({
      data: {
        sku: sku,
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: data.description,
        price: finalPrice,
        image: mainImageUrl,
        categoryId: data.categoryId,
        brand: data.brand,
        brandId: brandId,
        format: data.format,
        weight: data.weight,
        purchasePrice: data.purchasePrice,
        shippingCost: data.shippingCost,
        profitMargin: data.profitMargin,
        stock: data.stock,
        minStock: data.minStock || 5,
        inStock: data.stock > 0,
        images: {
          create: data.images?.map((img, index) => ({
            url: img.url,
            thumbnail: img.thumbnail,
            medium: img.medium,
            large: img.large,
            isMain: img.isMain || index === 0,
            sortOrder: img.sortOrder || index,
          })) || [],
        },
      },
      include: {
        images: true,
      },
    })

    await prisma.inventoryLog.create({
      data: {
        productId: product.id,
        changeType: 'INITIAL_STOCK',
        previousStock: 0,
        newStock: data.stock,
        changeAmount: data.stock,
        reason: 'Inventario inicial',
      },
    })

    return product
  }

  static async updateProduct(id: string, data: Partial<{
    name: string
    description: string
    price: number
    image: string | null
    images: Array<{
      url: string
      thumbnail?: string
      medium?: string
      large?: string
      isMain?: boolean
      sortOrder?: number
    }>
    categoryId: string
    brand: string
    format: string
    weight: string | null
    purchasePrice: number
    shippingCost: number
    profitMargin: number
    stock: number
    minStock: number
    isActive: boolean
    isFeatured: boolean
  }>) {
    const product = await prisma.product.findUnique({ 
      where: { id },
      include: { images: true }
    })
    if (!product) {
      throw new NotFoundError('Producto')
    }

    const { stock, price, images, ...rest } = data
    let stockChange = 0

    if (stock !== undefined && stock !== product.stock) {
      stockChange = stock - product.stock
    }

    const updateData: any = { ...rest }

    if (data.brand) {
      updateData.brandId = await this.getOrCreateBrand(data.brand)
    }

    if (stock !== undefined) {
      updateData.stock = stock
      updateData.inStock = stock > 0
    }

    if (price !== undefined) {
      updateData.price = price
    } else if (data.purchasePrice !== undefined || data.shippingCost !== undefined || data.profitMargin !== undefined) {
      const purchasePrice = data.purchasePrice ?? Number(product.purchasePrice)
      const shippingCost = data.shippingCost ?? Number(product.shippingCost)
      const profitMargin = data.profitMargin ?? Number(product.profitMargin)
      updateData.price = this.calculatePrice(purchasePrice, shippingCost, profitMargin)
    }

    // Handle images update
    if (images) {
      // Use the first image as the main image if provided
      const mainImageUrl = images.length > 0 
        ? images.find(img => img.isMain)?.url || images[0].url 
        : data.image

      updateData.image = mainImageUrl

      // Delete old images from DB (Cascade will not delete files, we need to handle that)
      await prisma.productImage.deleteMany({ where: { productId: id } })
      
      updateData.images = {
        create: images.map((img, index) => ({
          url: img.url,
          thumbnail: img.thumbnail,
          medium: img.medium,
          large: img.large,
          isMain: img.isMain || index === 0,
          sortOrder: img.sortOrder || index,
        }))
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: { images: true }
    })

    if (stockChange !== 0) {
      await prisma.inventoryLog.create({
        data: {
          productId: id,
          changeType: stockChange > 0 ? 'RESTOCK' : 'SALE',
          previousStock: product.stock,
          newStock: stock!,
          changeAmount: stockChange,
          reason: stockChange > 0 ? 'Reposicion' : 'Venta',
        },
      })
    }

    return updatedProduct
  }

  static async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { 
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' }
        }
      },
    })
    if (!product) {
      throw new NotFoundError('Producto')
    }
    return product
  }

  static async getAllProducts(options?: { categoryId?: string | null; search?: string; page?: number; limit?: number; onlyActive?: boolean }) {
    const { categoryId = null, search = '', page = 1, limit = 20, onlyActive = false } = options || {}

    const where: any = {}

    if (categoryId) where.categoryId = categoryId
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
        include: { category: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return {
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  static async getPublicProducts(options?: { categoryId?: string | null; search?: string }) {
    const { categoryId = null, search = '' } = options || {}

    const where: any = { isActive: true }

    if (categoryId) where.categoryId = categoryId
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { brand: { contains: search } },
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    })

    return products
  }

  static async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({ where: { id } })
    if (!product) {
      throw new NotFoundError('Producto')
    }
    // Borrado lógico: cambiamos isActive a false en lugar de eliminar el registro
    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    })
    return { success: true }
  }

  static async getInventoryReport() {
    const products = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    })

    const totalCost = products.reduce((sum, p) => {
      return sum + (Number(p.purchasePrice) + Number(p.shippingCost)) * p.stock
    }, 0)

    const totalValue = products.reduce((sum, p) => {
      return sum + Number(p.price) * p.stock
    }, 0)

    const lowStockProducts = products.filter(p => p.stock <= p.minStock)
    const outOfStockProducts = products.filter(p => p.stock === 0)

    return {
      totalProducts: products.length,
      totalItems: products.reduce((sum, p) => sum + p.stock, 0),
      totalCostUSD: totalCost,
      totalValueUSD: totalValue,
      potentialProfit: totalValue - totalCost,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        minStock: p.minStock,
        purchasePrice: Number(p.purchasePrice),
        shippingCost: Number(p.shippingCost),
        price: Number(p.price),
        profitMargin: Number(p.profitMargin),
        totalCost: (Number(p.purchasePrice) + Number(p.shippingCost)) * p.stock,
        totalValue: Number(p.price) * p.stock,
      })),
      alerts: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
    }
  }

  static async getInventoryLogs(productId?: string | null, limit = 50) {
    return prisma.inventoryLog.findMany({
      where: productId ? { productId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}
