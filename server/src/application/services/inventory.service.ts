import { NotFoundError } from '../../shared/errors/app.errors.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { CategoryRepository, BrandRepository, InventoryLogRepository, ProviderRepository, InventoryBatchRepository } from '../../domain/repositories/inventory.repository.js'
import { NotificationService } from './notification.service.js'
import { FavoriteRepository } from '../../domain/repositories/favorite.repository.js'
import { BatchManager } from './batch-manager.service.js'
import { ProductManager } from './product-manager.service.js'
import { AuditService } from './audit.service.js'
import { CreateProductDTO, UpdateProductDTO } from '../dtos/product.dto.js'

export class InventoryService {
  constructor(
    private productRepo: ProductRepository,
    private categoryRepo: CategoryRepository,
    private brandRepo: BrandRepository,
    private logRepo: InventoryLogRepository,
    private providerRepo: ProviderRepository,
    private inventoryBatchRepo: InventoryBatchRepository,
    private notificationService: NotificationService,
    private favoriteRepo: FavoriteRepository,
    private batchManager: BatchManager,
    private productManager: ProductManager,
    private auditService: AuditService
  ) {}

  /**
   * Actualiza precios basado en la tasa BCV.
   * Delega la lógica de notificación y actualización de campos a métodos internos.
   */
  async updatePricesByBCV(newRate: number, previousRate: number, userId?: string, ipAddress?: string, userAgent?: string) {
    if (previousRate <= 0) return

    const ratio = newRate / previousRate
    const products = await this.productRepo.findMany({
      where: { currency: 'BS' }
    })

    await this.auditService.logAction({
      entityType: 'BCV_UPDATE',
      action: 'UPDATE_PRICES',
      userId,
      details: { newRate, previousRate, productsAffected: products.length },
      ipAddress,
      userAgent
    })

    for (const product of products) {
      const currentPrice = Number(product.price)
      const newPrice = currentPrice * ratio
      
      await this.productRepo.update(product.id, { price: newPrice })

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

  // --- Delegación a ProductManager ---

  async createProduct(data: CreateProductDTO, userId?: string, ipAddress?: string, userAgent?: string) {
    return this.productManager.createProduct(data, userId, ipAddress, userAgent)
  }

  async updateProduct(id: string, data: UpdateProductDTO, userId?: string, ipAddress?: string, userAgent?: string) {
    return this.productManager.updateProduct(id, data, userId, ipAddress, userAgent)
  }

  async deleteProduct(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const product = await this.productRepo.findById(id)
    if (!product) {
      throw new NotFoundError('Producto')
    }
    
    // Marcamos como inactivo en lugar de borrar físicamente
    await this.productRepo.update(id, { isActive: false })

    await this.auditService.logAction({
      entityType: 'PRODUCT',
      entityId: id,
      action: 'DELETE',
      userId,
      details: { name: product.name, sku: product.sku },
      ipAddress,
      userAgent
    })

    return { success: true }
  }

  async getProductById(id: string) {
    return this.productManager.getProductById(id)
  }

  async getAllProducts(options?: any) {
    const { 
      categoryId = null, 
      categoryIds = null, 
      search = '', 
      page = 1, 
      limit = 20, 
      onlyActive = true, // Cambiado a true por defecto
      isActive = undefined 
    } = options || {}
    
    const { products, total } = await this.productRepo.findAll({ 
      categoryId, 
      categoryIds, 
      search, 
      page, 
      limit, 
      onlyActive,
      isActive 
    })

    return {
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }

  async getPublicProducts(options?: any) {
    const { 
      categoryId = null, 
      categoryIds = null, 
      search = '', 
      isFeatured = undefined,
      isOffer = undefined,
      limit = 1000 
    } = options || {}
    
    const { products } = await this.productRepo.findAll({ 
      categoryId, 
      categoryIds, 
      search, 
      onlyActive: true, 
      isFeatured: isFeatured === 'true' || isFeatured === true ? true : (isFeatured === 'false' || isFeatured === false ? false : undefined),
      isOffer: isOffer === 'true' || isOffer === true ? true : (isOffer === 'false' || isOffer === false ? false : undefined),
      limit 
    })
    return products
  }

  // --- Gestión de Marcas y Proveedores ---

  async getAllBrands() {
    return this.productRepo.getAllBrands()
  }

  async getProviders() {
    return this.providerRepo.findAll()
  }

  async createProvider(data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const existing = await this.providerRepo.findByName(data.name)
    if (existing) {
      return existing
    }
    const provider = await this.providerRepo.create({
      name: data.name,
      country: data.country || null,
      address: data.address || null,
    })

    await this.auditService.logAction({
      entityType: 'PROVIDER',
      entityId: provider.id,
      action: 'CREATE',
      userId,
      details: { name: provider.name },
      ipAddress,
      userAgent
    })

    return provider
  }

  async updateProvider(id: string, data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const provider = await this.providerRepo.findById(id)
    if (!provider) {
      throw new NotFoundError('Proveedor')
    }

    const updated = await this.providerRepo.update(id, {
      name: data.name,
      country: data.country || null,
      address: data.address || null,
    })

    await this.auditService.logAction({
      entityType: 'PROVIDER',
      entityId: id,
      action: 'UPDATE',
      userId,
      details: { name: updated.name, previousName: provider.name },
      ipAddress,
      userAgent
    })

    return updated
  }

  async deleteProvider(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const provider = await this.providerRepo.findById(id)
    if (!provider) {
      throw new NotFoundError('Proveedor')
    }

    await this.providerRepo.delete(id)

    await this.auditService.logAction({
      entityType: 'PROVIDER',
      entityId: id,
      action: 'DELETE',
      userId,
      details: { name: provider.name },
      ipAddress,
      userAgent
    })

    return { success: true }
  }

  // --- Gestión de Lotes y Reportes ---

  async getBatches(options?: { search?: string; limit?: number }) {
    return this.inventoryBatchRepo.findAll(options)
  }

  async createBatch(data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    return this.batchManager.createBatch(data, userId, ipAddress, userAgent)
  }

  async getInventoryReport(userId?: string, ipAddress?: string, userAgent?: string) {
    await this.auditService.logAction({
      entityType: 'REPORT',
      action: 'VIEW_INVENTORY',
      userId,
      ipAddress,
      userAgent
    })

    const products = await this.productRepo.findMany({
      include: { categories: true },
      orderBy: { name: 'asc' },
    })

    const totalCost = products.reduce((sum, p) => sum + Number(p.purchasePrice) * p.stock, 0)
    const totalValue = products.reduce((sum, p) => sum + Number(p.price) * p.stock, 0)

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
