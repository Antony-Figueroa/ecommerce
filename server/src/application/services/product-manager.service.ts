import { PrismaClient } from '../../generated/client/index.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { CategoryRepository, BrandRepository, InventoryLogRepository } from '../../domain/repositories/inventory.repository.js'
import { FavoriteRepository } from '../../domain/repositories/favorite.repository.js'
import { NotificationService } from './notification.service.js'
import { AuditService } from './audit.service.js'
import { NotFoundError, ValidationError } from '../../shared/errors/app.errors.js'
import { CreateProductDTO, UpdateProductDTO, ProductImageDTO } from '../dtos/product.dto.js'

export class ProductManager {
  constructor(
    private prisma: PrismaClient,
    private productRepo: ProductRepository,
    private categoryRepo: CategoryRepository,
    private brandRepo: BrandRepository,
    private logRepo: InventoryLogRepository,
    private favoriteRepo: FavoriteRepository,
    private notificationService: NotificationService,
    private auditService: AuditService
  ) {}

  /**
   * Procesa las imágenes para obtener la URL principal y la estructura de creación de Prisma
   */
  private processImages(images?: ProductImageDTO[], defaultImage?: string | null) {
    if (!images || images.length === 0) {
      return {
        mainImageUrl: defaultImage || null,
        prismaImages: []
      }
    }

    const mainImage = images.find(img => img.isMain) || images[0]
    const mainImageUrl = mainImage.url

    const prismaImages = images.map((img, index) => ({
      url: img.url,
      thumbnail: img.thumbnail,
      medium: img.medium,
      large: img.large,
      isMain: img.isMain || (index === 0 && !images.some(i => i.isMain)),
      sortOrder: img.sortOrder ?? index,
    }))

    return { mainImageUrl, prismaImages }
  }

  /**
   * Genera un slug amigable para URL a partir del nombre
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
  }

  /**
   * Valida que una lista de IDs de categorías existan en la base de datos
   */
  private async validateCategories(categoryIds: string[]) {
    for (const id of categoryIds) {
      const exists = await this.categoryRepo.findById(id)
      if (!exists) {
        throw new ValidationError(`La categoría con ID ${id} no existe`)
      }
    }
  }

  /**
   * Valida el formato básico de una URL de imagen
   */
  private validateImageUrl(url: string) {
    const urlPattern = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))$/i
    if (!url.startsWith('data:image/') && !urlPattern.test(url)) {
      // Permitimos base64 o URLs válidas de imagen
      console.warn(`[ProductManager] URL de imagen sospechosa: ${url}`)
    }
  }

  /**
   * Obtiene o crea una categoría por su nombre
   */
  async getOrCreateCategory(name: string) {
    const slug = this.generateSlug(name)
    const existing = await this.categoryRepo.findBySlug(slug)
    if (existing) return existing
    
    return await this.categoryRepo.create({
      name,
      slug,
      isActive: true,
      sortOrder: 0
    })
  }

  async createProduct(data: CreateProductDTO, userId?: string, ipAddress?: string, userAgent?: string) {
    // Validaciones de negocio profundas
    if (!data.name || data.name.trim() === '') {
      throw new ValidationError('El nombre del producto es obligatorio')
    }
    if (!data.categoryIds || data.categoryIds.length === 0) {
      throw new ValidationError('El producto debe pertenecer al menos a una categoría')
    }
    
    // Validar existencia de categorías
    await this.validateCategories(data.categoryIds)

    if (data.price !== undefined && data.price < 0) {
      throw new ValidationError('El precio de venta no puede ser negativo')
    }
    if (data.purchasePrice !== undefined && data.purchasePrice < 0) {
      throw new ValidationError('El precio de compra no puede ser negativo')
    }
    if (data.stock !== undefined && data.stock < 0) {
      throw new ValidationError('El stock no puede ser negativo')
    }

    // Validar URLs de imágenes
    if (data.image) this.validateImageUrl(data.image)
    if (data.images) {
      data.images.forEach(img => this.validateImageUrl(img.url))
    }

    let sku = data.sku
    if (!sku || sku.trim() === '') {
      sku = await this.generateSKU(data.name, data.categoryIds, data.brand ?? undefined)
    }

    const existingSku = await this.productRepo.findBySku(sku)
    if (existingSku) {
      throw new ValidationError(`Ya existe un producto con el SKU: ${sku}`)
    }

    const purchasePrice = Number(data.purchasePrice || 0)
    const salePrice = Number(data.price || 0)
    
    // Validación de margen de ganancia
    if (purchasePrice > 0 && salePrice > 0 && salePrice < purchasePrice) {
      // Opcional: Podríamos lanzar una advertencia o error, por ahora solo calculamos el margen real
      console.warn(`[ProductManager] Producto ${data.name} creado con precio de venta menor al de compra.`)
    }
    
    const profitMargin = data.profitMargin || (purchasePrice > 0 ? salePrice / purchasePrice : 1.5)

    const { mainImageUrl, prismaImages } = this.processImages(data.images, data.image)

    return await this.prisma.$transaction(async (tx) => {
      const brandId = data.brand ? await this.brandRepo.upsert(data.brand, tx).then(b => b.id) : undefined

      const product = await this.productRepo.create({
        sku,
        productCode: data.productCode,
        name: data.name,
        slug: this.generateSlug(data.name),
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
        purchasePrice,
        profitMargin,
        stock: data.stock || 0,
        minStock: data.minStock || 5,
        inStock: (data.stock || 0) > 0,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        isOffer: data.isOffer ?? false,
        images: {
          create: prismaImages,
        },
      }, tx)

      // Registrar en log de inventario si hay stock inicial
      if (data.stock && data.stock > 0) {
        await this.logRepo.create({
          productId: product.id,
          changeType: 'RESTOCK',
          previousStock: 0,
          newStock: data.stock,
          changeAmount: data.stock,
          reason: 'Carga inicial de producto',
        }, tx)
      }

      await this.auditService.logAction({
        entityType: 'PRODUCT',
        entityId: product.id,
        action: 'CREATE',
        userId,
        details: { name: product.name, sku: product.sku },
        ipAddress,
        userAgent
      }, tx)

      return product
    })
  }

  async updateProduct(id: string, data: UpdateProductDTO, userId?: string, ipAddress?: string, userAgent?: string) {
    const product = await this.productRepo.findById(id)
    if (!product) throw new NotFoundError('Producto')

    const updateData: any = {}
    const changedFields: string[] = []

    // Mapeo dinámico de campos básicos
    const basicFields: (keyof UpdateProductDTO)[] = [
      'productCode', 'description', 'format', 'weight', 
      'minStock', 'isActive', 'isFeatured', 'isOffer', 'purchasePrice'
    ]

    for (const field of basicFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field]
        changedFields.push(field)
      }
    }

    if (data.name) {
      if (data.name.trim() === '') throw new ValidationError('El nombre no puede estar vacío')
      updateData.name = data.name
      updateData.slug = this.generateSlug(data.name)
      changedFields.push('name', 'slug')
    }

    if (data.brand) {
      updateData.brand = data.brand
      // brandId se asigna dentro de la transacción
      changedFields.push('brand')
    }

    if (data.categoryIds) {
      if (data.categoryIds.length === 0) throw new ValidationError('El producto debe tener al menos una categoría')
      await this.validateCategories(data.categoryIds)
      updateData.categories = { set: data.categoryIds.map((cid: string) => ({ id: cid })) }
      changedFields.push('categories')
    }

    if (data.stock !== undefined) {
      if (data.stock < 0) throw new ValidationError('El stock no puede ser negativo')
      updateData.stock = data.stock
      updateData.inStock = data.stock > 0
      changedFields.push('stock', 'inStock')
    }

    if (data.price !== undefined) {
      if (data.price < 0) throw new ValidationError('El precio no puede ser negativo')
      updateData.price = data.price
      const currentPurchase = data.purchasePrice ?? Number(product.purchasePrice)
      updateData.profitMargin = currentPurchase > 0 ? Number(data.price) / currentPurchase : 1.5
      changedFields.push('price', 'profitMargin')
    }

    return await this.prisma.$transaction(async (tx) => {
      if (data.brand) {
        updateData.brand = data.brand
        updateData.brandId = await this.brandRepo.upsert(data.brand, tx).then(b => b.id)
        changedFields.push('brand', 'brandId')
      }

      if (data.images) {
        data.images.forEach(img => this.validateImageUrl(img.url))
        const { mainImageUrl, prismaImages } = this.processImages(data.images, data.image)
        updateData.image = mainImageUrl
        await this.productRepo.deleteImages(id, tx)
        updateData.images = { create: prismaImages }
        changedFields.push('images', 'image')
      } else if (data.image !== undefined) {
        updateData.image = data.image
        changedFields.push('image')
      }

      const updatedProduct = await this.productRepo.update(id, updateData, tx)

      // Auditoría
      await this.auditService.logAction({
        entityType: 'PRODUCT',
        entityId: id,
        action: 'UPDATE',
        userId,
        details: { changedFields },
        ipAddress,
        userAgent
      }, tx)

      // Logs de Inventario
      const stockChange = (data.stock !== undefined) ? (data.stock - product.stock) : 0
      if (stockChange !== 0) {
        await this.logRepo.create({
          productId: id,
          changeType: stockChange > 0 ? 'RESTOCK' : 'ADJUSTMENT',
          previousStock: product.stock,
          newStock: updatedProduct.stock,
          changeAmount: stockChange,
          reason: stockChange > 0 ? 'Reposición manual' : 'Ajuste manual',
        }, tx)
      }

      // Notificaciones (fuera de la transacción si son asíncronas o pueden fallar, 
      // pero aquí las dejamos para que el usuario vea que se disparan)
      if (data.price !== undefined && Number(data.price) < Number(product.price)) {
        this.notifyPriceDrop(updatedProduct, product.price, data.price).catch(err => 
          console.error('Error in notifyPriceDrop:', err)
        )
      }

      if (product.stock === 0 && updatedProduct.stock > 0) {
        this.notifyRestock(updatedProduct).catch(err => 
          console.error('Error in notifyRestock:', err)
        )
      }

      return updatedProduct
    })
  }

  async getProductById(id: string) {
    const product = await this.productRepo.findById(id)
    if (!product) {
      throw new NotFoundError('Producto')
    }
    return product
  }

  /**
   * Limpia todos los productos, categorías y marcas de la base de datos
   */
  async clearDatabase() {
    return await this.prisma.$transaction(async (tx) => {
      // El orden es importante por las claves foráneas
      await tx.inventoryLog.deleteMany({})
      await tx.productImage.deleteMany({})
      await tx.favorite.deleteMany({})
      await tx.cartItem.deleteMany({})
      await tx.inventoryBatchItem.deleteMany({})
      await tx.batch.deleteMany({})
      await tx.productPriceHistory.deleteMany({})
      await tx.requirementItem.deleteMany({})
      
      // Eliminar productos
      await tx.product.deleteMany({})
      
      // Eliminar categorías y marcas
      await tx.category.deleteMany({})
      await tx.brand.deleteMany({})
      
      return true
    })
  }

  private async generateSKU(name: string, categoryIds: string[], brandName?: string): Promise<string> {
    const categoryId = categoryIds[0]
    const category = await this.categoryRepo.findById(categoryId)
    const categoryPrefix = (category?.name || 'GEN')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3)
      .padEnd(3, 'X')
    
    // Incluir prefijo de marca si existe
    const brandPrefix = (brandName || 'GEN')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3)
      .padEnd(3, 'X')
    
    // Limpiar nombre: solo letras y números, tomar los primeros 3 caracteres significativos
    // Evitar artículos comunes en español
    const stopWords = ['EL', 'LA', 'LOS', 'LAS', 'UN', 'UNA', 'UNOS', 'UNAS', 'DE', 'DEL', 'CON', 'SIN', 'PARA']
    const cleanName = name
      .toUpperCase()
      .split(/\s+/)
      .filter(word => !stopWords.includes(word))
      .join('')
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 3)
      .padEnd(3, '0')
    
    const basePrefix = `${categoryPrefix}-${brandPrefix}-${cleanName}`
    
    // Contar cuántos productos existen con este prefijo base para una secuencia más lógica
    const count = await this.productRepo.count({
      sku: {
        startsWith: basePrefix
      }
    })
    
    const sequence = (count + 1).toString().padStart(4, '0')
    const sku = `${basePrefix}-${sequence}`
    
    // Verificación final de colisión (por si acaso el conteo no fue exacto por concurrencia)
    const existing = await this.productRepo.findBySku(sku)
    if (existing) {
      // Si hay colisión, usamos un sufijo de tiempo corto para desempatar
      const timestamp = Date.now().toString().slice(-4)
      return `${basePrefix}-V${timestamp}`
    }
    
    return sku
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
