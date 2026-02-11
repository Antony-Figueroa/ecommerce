import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { CategoryRepository, BrandRepository, InventoryLogRepository } from '../../domain/repositories/inventory.repository.js'
import { FavoriteRepository } from '../../domain/repositories/favorite.repository.js'
import { NotificationService } from './notification.service.js'
import { AuditService } from './audit.service.js'
import { NotFoundError, ValidationError } from '../../shared/errors/app.errors.js'

export class ProductManager {
  constructor(
    private productRepo: ProductRepository,
    private categoryRepo: CategoryRepository,
    private brandRepo: BrandRepository,
    private logRepo: InventoryLogRepository,
    private favoriteRepo: FavoriteRepository,
    private notificationService: NotificationService,
    private auditService: AuditService
  ) {}

  async createProduct(data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    let sku = data.sku
    if (!sku || sku.trim() === '') {
      sku = await this.generateSKU(data.name, data.categoryIds)
    }

    const existingSku = await this.productRepo.findBySku(sku)
    if (existingSku) {
      throw new ValidationError('Ya existe un producto con este SKU')
    }

    const purchasePrice = Number(data.purchasePrice || 0)
    const salePrice = Number(data.price || 0)
    const profitMargin = data.profitMargin || (purchasePrice > 0 ? salePrice / purchasePrice : 1.5)

    const mainImageUrl = data.images && data.images.length > 0 
      ? data.images.find((img: any) => img.isMain)?.url || data.images[0].url 
      : data.image

    const brandId = await this.getOrCreateBrand(data.brand)

    const product = await this.productRepo.create({
      sku,
      productCode: data.productCode,
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: data.description,
      price: salePrice,
      shippingCost: data.shippingCost || 0,
      image: mainImageUrl,
      categories: {
        connect: data.categoryIds.map((id: string) => ({ id }))
      },
      brand: data.brand,
      brandId: brandId,
      format: data.format,
      weight: data.weight,
      purchasePrice,
      profitMargin,
      stock: data.stock || 0,
      minStock: data.minStock || 5,
      inStock: (data.stock || 0) > 0,
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
    })

    await this.auditService.logAction({
      entityType: 'PRODUCT',
      entityId: product.id,
      action: 'CREATE',
      userId,
      details: { name: product.name, sku: product.sku },
      ipAddress,
      userAgent
    })

    return product
  }

  async updateProduct(id: string, data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const product = await this.productRepo.findById(id)
    if (!product) throw new NotFoundError('Producto')

    const { stock, price, images, categoryIds, ...rest } = data
    const updateData: any = { ...rest }

    if (categoryIds) {
      updateData.categories = { set: categoryIds.map((cid: string) => ({ id: cid })) }
    }

    if (data.name) {
      updateData.name = data.name
      updateData.slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }

    if (data.brand) {
      updateData.brand = data.brand
      updateData.brandId = await this.getOrCreateBrand(data.brand)
    }

    if (stock !== undefined) {
      updateData.stock = stock
      updateData.inStock = stock > 0
    }

    if (price !== undefined) {
      updateData.price = price
      const currentPurchase = data.purchasePrice ?? Number(product.purchasePrice)
      updateData.profitMargin = currentPurchase > 0 ? Number(price) / currentPurchase : 1.5
    }

    if (images) {
      const mainImageUrl = images.length > 0 
        ? images.find((img: any) => img.isMain)?.url || images[0].url 
        : images[0].url
      updateData.image = mainImageUrl
      await this.productRepo.deleteImages(id)
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

    const updatedProduct = await this.productRepo.update(id, updateData)

    // Audit the update
    await this.auditService.logAction({
      entityType: 'PRODUCT',
      entityId: id,
      action: 'UPDATE',
      userId,
      details: { changedFields: Object.keys(updateData) },
      ipAddress,
      userAgent
    })

    // Handle notifications for price drop
    if (price !== undefined && Number(price) < Number(product.price)) {
      await this.notifyPriceDrop(updatedProduct, product.price, price)
    }

    // Handle notifications for restock
    if (product.stock === 0 && updatedProduct.stock > 0) {
      await this.notifyRestock(updatedProduct)
    }

    // Log stock change if any
    const stockChange = (stock !== undefined) ? (stock - product.stock) : 0
    if (stockChange !== 0) {
      await this.logRepo.create({
        productId: id,
        changeType: stockChange > 0 ? 'RESTOCK' : 'ADJUSTMENT',
        previousStock: product.stock,
        newStock: updatedProduct.stock,
        changeAmount: stockChange,
        reason: stockChange > 0 ? 'Reposición manual' : 'Ajuste manual',
      })
    }

    return updatedProduct
  }

  async getProductById(id: string) {
    const product = await this.productRepo.findById(id)
    if (!product) {
      throw new NotFoundError('Producto')
    }
    return product
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
    return existing ? `${sku}-${Math.floor(Math.random() * 1000)}` : sku
  }

  private async getOrCreateBrand(name: string): Promise<string> {
    const brand = await this.brandRepo.upsert(name)
    return brand.id
  }

  private async notifyPriceDrop(product: any, oldPrice: any, newPrice: any) {
    try {
      const interestedUsers = await this.favoriteRepo.findAllByProductId(product.id)
      for (const fav of interestedUsers) {
        await this.notificationService.createNotification({
          type: 'PRICE_DROP',
          category: 'FAVORITES',
          priority: 'NORMAL',
          title: '¡Bajada de precio!',
          message: `El producto ${product.name} ha bajado de precio de $${oldPrice} a $${newPrice}. ¡Aprovecha ahora!`,
          userId: fav.userId,
          link: `/product/${product.slug}`,
          metadata: JSON.stringify({ productId: product.id, oldPrice, newPrice })
        })
      }
    } catch (error) {
      console.error('Error sending price drop notifications:', error)
    }
  }

  private async notifyRestock(product: any) {
    try {
      const interestedUsers = await this.favoriteRepo.findAllByProductId(product.id)
      for (const fav of interestedUsers) {
        await this.notificationService.createNotification({
          type: 'FAVORITE_ALERT',
          category: 'FAVORITES',
          priority: 'NORMAL',
          title: '¡Producto Disponible!',
          message: `El producto ${product.name} que tienes en tus favoritos ya está disponible de nuevo.`,
          userId: fav.userId,
          link: `/product/${product.slug}`,
          metadata: JSON.stringify({ productId: product.id })
        })
      }
    } catch (error) {
      console.error('Error sending restock notifications:', error)
    }
  }
}
