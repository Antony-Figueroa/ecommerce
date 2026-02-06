import { NotFoundError, ValidationError } from '../../shared/errors/app.errors.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { CategoryRepository, BrandRepository, InventoryLogRepository } from '../../domain/repositories/inventory.repository.js'
import { NotificationService } from './notification.service.js'
import { FavoriteRepository } from '../../domain/repositories/favorite.repository.js'

export class InventoryService {
  constructor(
    private productRepo: ProductRepository,
    private categoryRepo: CategoryRepository,
    private brandRepo: BrandRepository,
    private logRepo: InventoryLogRepository,
    private notificationService: NotificationService,
    private favoriteRepo: FavoriteRepository
  ) {}

  async updatePricesByBCV(newRate: number, previousRate: number) {
    if (previousRate <= 0) return

    const ratio = newRate / previousRate
    const products = await this.productRepo.findMany({
      where: { currency: 'BS' }
    })

    for (const product of products) {
      const currentPrice = Number(product.price)
      const newPrice = currentPrice * ratio
      
      await this.productRepo.update(product.id, { price: newPrice })

      // Notificar a usuarios si el precio cambió significativamente
      if (Math.abs(newPrice - currentPrice) > 0.01) {
        try {
          const interestedUsers = await this.favoriteRepo.findAllByProductId(product.id)
          for (const fav of interestedUsers) {
            await this.notificationService.createNotification({
              type: 'PRICE_UPDATE',
              category: 'FAVORITES',
              priority: 'NORMAL',
              title: 'Actualización de precio',
              message: `El precio de ${product.name} se ha actualizado a $${newPrice.toFixed(2)} debido al cambio de tasa BCV.`,
              userId: fav.userId,
              link: `/product/${product.slug}`,
              metadata: JSON.stringify({ productId: product.id, oldPrice: currentPrice, newPrice: newPrice })
            })
          }
        } catch (error) {
          console.error('Error sending price update notifications:', error)
        }
      }
    }
  }

  private calculatePrice(purchasePrice: number, margin: number): number {
    return Number(purchasePrice) * Number(margin)
  }

  private calculateMargin(purchasePrice: number, salePrice: number): number {
    if (Number(purchasePrice) <= 0) return 0
    return Number(salePrice) / Number(purchasePrice)
  }

  private async generateSKU(name: string, categoryIds: string[]): Promise<string> {
    const categoryId = categoryIds[0]
    const category = await this.categoryRepo.findById(categoryId)
    const categoryPrefix = (category?.name || 'GEN').substring(0, 3).toUpperCase()
    const namePrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
    
    const count = await this.productRepo.count({})
    const sequence = (count + 1).toString().padStart(4, '0')
    const sku = `${categoryPrefix}-${namePrefix}-${sequence}`
    
    const existing = await this.productRepo.findBySku(sku)
    if (existing) {
      return `${sku}-${Math.floor(Math.random() * 1000)}`
    }
    
    return sku
  }

  async getAllBrands() {
    const brands = await this.brandRepo.findAll()
    return brands.map(b => b.name)
  }

  private async getOrCreateBrand(name: string): Promise<string> {
    const brand = await this.brandRepo.upsert(name)
    return brand.id
  }

  async createProduct(data: any) {
    let sku = data.sku
    if (!sku || sku.trim() === '') {
      sku = await this.generateSKU(data.name, data.categoryIds)
    }

    const existingSku = await this.productRepo.findBySku(sku)
    if (existingSku) {
      throw new ValidationError('Ya existe un producto con este SKU')
    }

    const purchasePrice = data.purchasePrice || 0
    const salePrice = data.price || this.calculatePrice(purchasePrice, data.profitMargin || 1.5)
    const profitMargin = data.profitMargin || this.calculateMargin(purchasePrice, salePrice)

    const mainImageUrl = data.images && data.images.length > 0 
      ? data.images.find((img: any) => img.isMain)?.url || data.images[0].url 
      : data.image

    const brandId = await this.getOrCreateBrand(data.brand)

    const product = await this.productRepo.create({
      sku: sku,
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: data.description,
      price: salePrice,
      image: mainImageUrl,
      categories: {
        connect: data.categoryIds.map((id: string) => ({ id }))
      },
      brand: data.brand,
      brandId: brandId,
      format: data.format,
      weight: data.weight,
      purchasePrice: purchasePrice,
      profitMargin: profitMargin,
      stock: data.stock,
      minStock: data.minStock || 5,
      inStock: data.stock > 0,
      images: {
        create: data.images?.map((img: any, index: number) => ({
          url: img.url,
          thumbnail: img.thumbnail,
          medium: img.medium,
          large: img.large,
          isMain: img.isMain || index === 0,
          sortOrder: img.sortOrder || index,
        })) || [],
      },
      // Crear lote inicial
      batches: {
        create: {
          batchNumber: data.batchNumber || `INIT-${Date.now()}`,
          expirationDate: data.expirationDate ? new Date(data.expirationDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          stock: data.stock,
          purchasePrice: purchasePrice,
          salePrice: salePrice,
        }
      },
      // Historial de precios inicial
      priceHistory: {
        create: {
          purchasePrice: purchasePrice,
          salePrice: salePrice,
          batchQuantity: data.stock,
          batchNumber: data.batchNumber || 'INITIAL',
        }
      }
    })

    await this.logRepo.create({
      productId: product.id,
      changeType: 'INITIAL_STOCK',
      previousStock: 0,
      newStock: data.stock,
      changeAmount: data.stock,
      reason: 'Inventario inicial',
    })

    return product
  }

  async updateProduct(id: string, data: any) {
    const product = await this.productRepo.findById(id)
    if (!product) {
      throw new NotFoundError('Producto')
    }

    const { stock, price, images, batch, ...rest } = data
    let stockChange = 0

    // Si hay datos de un nuevo lote (Restock)
    if (batch) {
      const newBatchPurchasePrice = Number(batch.purchasePrice)
      const newBatchSalePrice = Number(batch.salePrice) || this.calculatePrice(newBatchPurchasePrice, data.profitMargin || product.profitMargin)
      const newBatchQuantity = Number(batch.stock)
      
      stockChange = newBatchQuantity

      // Actualizar precios globales del producto si se indica
      const updateData: any = {
        ...rest,
        stock: product.stock + newBatchQuantity,
        inStock: true,
        purchasePrice: newBatchPurchasePrice, // Actualizamos con el último precio de compra
        price: newBatchSalePrice, // Actualizamos con el último precio de venta
        profitMargin: this.calculateMargin(newBatchPurchasePrice, newBatchSalePrice),
      }

      // Añadir lote e historial
      updateData.batches = {
        create: {
          batchNumber: batch.batchNumber,
          expirationDate: new Date(batch.expirationDate),
          stock: newBatchQuantity,
          purchasePrice: newBatchPurchasePrice,
          salePrice: newBatchSalePrice,
        }
      }

      updateData.priceHistory = {
        create: {
          purchasePrice: newBatchPurchasePrice,
          salePrice: newBatchSalePrice,
          batchQuantity: newBatchQuantity,
          batchNumber: batch.batchNumber,
        }
      }

      if (images) {
        await this.handleImagesUpdate(id, images, updateData)
      }

      const updatedProduct = await this.productRepo.update(id, updateData)

      await this.logRepo.create({
        productId: id,
        changeType: 'RESTOCK',
        previousStock: product.stock,
        newStock: updateData.stock,
        changeAmount: newBatchQuantity,
        reason: `Nuevo lote: ${batch.batchNumber}`,
      })

      return updatedProduct
    }

    // Actualización normal (sin lote nuevo)
    if (stock !== undefined && stock !== product.stock) {
      stockChange = stock - product.stock
    }

    const { categoryIds, ...restUpdate } = rest
    const updateData: any = { ...restUpdate }

    if (categoryIds) {
      updateData.categories = {
        set: categoryIds.map((id: string) => ({ id }))
      }
    }

    if (data.brand) {
      updateData.brandId = await this.getOrCreateBrand(data.brand)
    }

    if (stock !== undefined) {
      updateData.stock = stock
      updateData.inStock = stock > 0
    }

    if (price !== undefined) {
      updateData.price = price
      // Recalcular margen si el precio de venta cambia manualmente
      updateData.profitMargin = this.calculateMargin(Number(product.purchasePrice), Number(price))
    } else if (data.purchasePrice !== undefined || data.profitMargin !== undefined) {
      const purchasePrice = data.purchasePrice ?? Number(product.purchasePrice)
      const profitMargin = data.profitMargin ?? Number(product.profitMargin)
      updateData.price = this.calculatePrice(purchasePrice, profitMargin)
    }

    if (images) {
      await this.handleImagesUpdate(id, images, updateData)
    }

    const updatedProduct = await this.productRepo.update(id, updateData)

    // Notificar a usuarios que tienen este producto en favoritos si el precio bajó
    if (price !== undefined && Number(price) < Number(product.price)) {
      try {
        const interestedUsers = await this.favoriteRepo.findAllByProductId(id)
        for (const fav of interestedUsers) {
          await this.notificationService.createNotification({
            type: 'PRICE_DROP',
            category: 'FAVORITES',
            priority: 'NORMAL',
            title: '¡Bajada de precio!',
            message: `El producto ${updatedProduct.name} ha bajado de precio de $${product.price} a $${price}. ¡Aprovecha ahora!`,
            userId: fav.userId,
            link: `/product/${updatedProduct.slug}`,
            metadata: JSON.stringify({ productId: updatedProduct.id, oldPrice: product.price, newPrice: price })
          })
        }
      } catch (error) {
        console.error('Error sending price drop notifications:', error)
      }
    }

    // Notificar a usuarios que tienen este producto en favoritos si el stock pasó de 0 a > 0
    if (product.stock === 0 && updatedProduct.stock > 0) {
      try {
        const interestedUsers = await this.favoriteRepo.findAllByProductId(id)
        for (const fav of interestedUsers) {
          await this.notificationService.createNotification({
            type: 'FAVORITE_ALERT',
            category: 'FAVORITES',
            priority: 'NORMAL',
            title: '¡Producto Disponible!',
            message: `El producto ${updatedProduct.name} que tienes en tus favoritos ya está disponible de nuevo.`,
            userId: fav.userId,
            link: `/product/${updatedProduct.slug}`,
            metadata: JSON.stringify({ productId: updatedProduct.id })
          })
        }
      } catch (error) {
        console.error('Error sending favorite notifications:', error)
      }
    }

    if (stockChange !== 0) {
      await this.logRepo.create({
        productId: id,
        changeType: stockChange > 0 ? 'RESTOCK' : 'SALE',
        previousStock: product.stock,
        newStock: updateData.stock ?? product.stock,
        changeAmount: stockChange,
        reason: stockChange > 0 ? 'Reposicion' : 'Venta',
      })
    }

    return updatedProduct
  }

  private async handleImagesUpdate(productId: string, images: any[], updateData: any) {
    const mainImageUrl = images.length > 0 
      ? images.find((img: any) => img.isMain)?.url || images[0].url 
      : images[0].url

    updateData.image = mainImageUrl

    await this.productRepo.deleteImages(productId)
    
    updateData.images = {
      create: images.map((img: any, index: number) => ({
        url: img.url,
        thumbnail: img.thumbnail,
        medium: img.medium,
        large: img.large,
        isMain: img.isMain || index === 0,
        sortOrder: img.sortOrder || index,
      }))
    }
  }

  async getProductById(id: string) {
    const product = await this.productRepo.findById(id)
    if (!product) {
      throw new NotFoundError('Producto')
    }
    return product
  }

  async getAllProducts(options?: any) {
    const { categoryId = null, categoryIds = null, search = '', page = 1, limit = 20, onlyActive = false } = options || {}
    const { products, total } = await this.productRepo.findAll({ categoryId, categoryIds, search, page, limit, onlyActive })

    return {
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getPublicProducts(options?: any) {
    const { categoryId = null, categoryIds = null, search = '' } = options || {}
    const { products } = await this.productRepo.findAll({ categoryId, categoryIds, search, onlyActive: true, limit: 1000 })
    return products
  }

  async deleteProduct(id: string) {
    const product = await this.productRepo.findById(id)
    if (!product) {
      throw new NotFoundError('Producto')
    }
    await this.productRepo.update(id, { isActive: false })
    return { success: true }
  }

  async getInventoryReport() {
    const products = await this.productRepo.findMany({
      include: { categories: true },
      orderBy: { name: 'asc' },
    })

    const totalCost = products.reduce((sum, p) => {
      return sum + Number(p.purchasePrice) * p.stock
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
        price: Number(p.price),
        profitMargin: Number(p.profitMargin),
        totalCost: Number(p.purchasePrice) * p.stock,
        totalValue: Number(p.price) * p.stock,
      })),
      alerts: {
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
    }
  }

  async getInventoryLogs(productId?: string | null, limit = 50) {
    return this.logRepo.findAll(productId || undefined)
  }
}
