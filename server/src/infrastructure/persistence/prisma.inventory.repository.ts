import { prisma } from './prisma.client.js'
import { Category, Brand, InventoryLog, CategoryRepository, BrandRepository, InventoryLogRepository, Provider, ProviderRepository, InventoryBatchRepository, InventoryLocationRepository, InventoryStockRepository, InventoryTransferRepository, InventoryLocation, InventoryStock, InventoryTransfer } from '../../domain/repositories/inventory.repository.js'

export class PrismaCategoryRepository implements CategoryRepository {
  async findAll(options?: any): Promise<Category[]> {
    const { includeInactive, ...prismaOptions } = options || {}
    const categories = await prisma.category.findMany({
      ...prismaOptions,
      include: options?.include || { _count: { select: { products: true } } },
      orderBy: options?.orderBy || { name: 'asc' },
    })
    return categories as unknown as Category[]
  }

  async findFirst(options: any): Promise<Category | null> {
    const category = await prisma.category.findFirst(options)
    return category as unknown as Category | null
  }

  async findById(id: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({ 
      where: { id },
      include: { _count: { select: { products: true } } }
    })
    return category as unknown as Category | null
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const category = await prisma.category.findUnique({ 
      where: { slug },
      include: { _count: { select: { products: true } } }
    })
    return category as unknown as Category | null
  }

  async findByName(name: string): Promise<Category | null> {
    const category = await prisma.category.findFirst({ where: { name } })
    return category as unknown as Category | null
  }

  async create(data: any, tx?: any): Promise<Category> {
    const client = tx || prisma
    const category = await client.category.create({ data })
    return category as unknown as Category
  }

  async update(id: string, data: any, tx?: any): Promise<Category> {
    const client = tx || prisma
    const category = await client.category.update({ where: { id }, data })
    return category as unknown as Category
  }

  async delete(id: string, tx?: any): Promise<void> {
    const client = tx || prisma
    await client.category.delete({ where: { id } })
  }

  async upsert(slug: string, data: any, tx?: any): Promise<Category> {
    const client = tx || prisma
    const { name, ...rest } = data
    const category = await client.category.upsert({
      where: { slug },
      update: rest,
      create: { slug, name, ...rest },
    })
    return category as unknown as Category
  }
}

export class PrismaBrandRepository implements BrandRepository {
  async findAll(): Promise<Brand[]> {
    const brands = await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })
    return brands as unknown as Brand[]
  }

  async findById(id: string): Promise<Brand | null> {
    const brand = await prisma.brand.findUnique({ where: { id } })
    return brand as unknown as Brand | null
  }

  async findByName(name: string): Promise<Brand | null> {
    const brand = await prisma.brand.findUnique({ where: { name } })
    return brand as unknown as Brand | null
  }

  async upsert(name: string, tx?: any): Promise<Brand> {
    const client = tx || prisma
    const brand = await client.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    return brand as unknown as Brand
  }
}

export class PrismaInventoryLogRepository implements InventoryLogRepository {
  async create(data: any, tx?: any): Promise<InventoryLog> {
    const client = tx || prisma
    const log = await client.inventoryLog.create({
      data
    })
    return log as unknown as InventoryLog
  }

  async findAll(productId?: string): Promise<InventoryLog[]> {
    const logs = await prisma.inventoryLog.findMany({
      where: productId ? { productId } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return logs as unknown as InventoryLog[]
  }
}

export class PrismaProviderRepository implements ProviderRepository {
  async findAll(): Promise<Provider[]> {
    const providers = await prisma.provider.findMany({
      include: { _count: { select: { batches: true } } },
      orderBy: { name: 'asc' },
    })
    return providers as unknown as Provider[]
  }

  async findByName(name: string): Promise<Provider | null> {
    const provider = await prisma.provider.findFirst({ 
      where: { name },
      include: { _count: { select: { batches: true } } }
    })
    return provider as unknown as Provider | null
  }

  async findById(id: string): Promise<Provider | null> {
    const provider = await prisma.provider.findUnique({ 
      where: { id },
      include: { _count: { select: { batches: true } } }
    })
    return provider as unknown as Provider | null
  }

  async create(data: any): Promise<Provider> {
    const provider = await prisma.provider.create({ data })
    return provider as unknown as Provider
  }

  async update(id: string, data: any): Promise<Provider> {
    const provider = await prisma.provider.update({ where: { id }, data })
    return provider as unknown as Provider
  }

  async delete(id: string): Promise<void> {
    await prisma.provider.delete({ where: { id } })
  }
}

export class PrismaInventoryBatchRepository implements InventoryBatchRepository {
  async findAll(options?: any) {
    const { search, limit } = options || {}
    const where: any = {}

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { notes: { contains: search } },
        { provider: { name: { contains: search } } }
      ]
    }

    const findOptions: any = {
      where,
      take: limit || undefined,
      include: {
        provider: true,
        items: {
          include: {
            product: true,
          },
          orderBy: { entryDate: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    }

    return prisma.inventoryBatch.findMany(findOptions)
  }

  async findById(id: string) {
    return prisma.inventoryBatch.findUnique({
      where: { id },
      include: {
        provider: true,
        items: {
          include: { product: true },
          orderBy: { entryDate: 'asc' }
        }
      }
    })
  }

  async create(data: any, tx?: any): Promise<any> {
    const client = tx || prisma
    return client.inventoryBatch.create({
      data,
      include: {
        provider: true,
        items: {
          include: { product: true }
        }
      }
    })
  }

  async update(id: string, data: any, tx?: any): Promise<any> {
    const client = tx || prisma
    return client.inventoryBatch.update({
      where: { id },
      data,
      include: {
        provider: true,
        items: {
          include: { product: true }
        }
      }
    })
  }

  async findAvailableItemsByProduct(productId: string, tx?: any): Promise<any[]> {
    const client = tx || prisma
    return client.inventoryBatchItem.findMany({
      where: {
        productId,
        quantity: { gt: 0 }
      },
      orderBy: { entryDate: 'asc' }
    })
  }

  async updateItem(id: string, data: any, tx?: any): Promise<any> {
    const client = tx || prisma
    return client.inventoryBatchItem.update({
      where: { id },
      data
    })
  }

  async delete(id: string, tx?: any): Promise<void> {
    const client = tx || prisma
    // Eliminar el lote y sus items (Prisma maneja el borrado en cascada si está configurado, 
    // pero aquí lo hacemos explícito o confiamos en el esquema)
    await client.inventoryBatch.delete({
      where: { id }
    })
  }
}

export class PrismaInventoryLocationRepository implements InventoryLocationRepository {
  async findAll(): Promise<InventoryLocation[]> {
    const locations = await prisma.inventoryLocation.findMany({
      orderBy: { name: 'asc' },
    })
    return locations as unknown as InventoryLocation[]
  }

  async findById(id: string): Promise<InventoryLocation | null> {
    const location = await prisma.inventoryLocation.findUnique({ where: { id } })
    return location as unknown as InventoryLocation | null
  }

  async findDefault(): Promise<InventoryLocation | null> {
    const location = await prisma.inventoryLocation.findFirst({ where: { isDefault: true } })
    return location as unknown as InventoryLocation | null
  }

  async create(data: any): Promise<InventoryLocation> {
    if (data.isDefault) {
      await prisma.inventoryLocation.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }
    const location = await prisma.inventoryLocation.create({ data })
    return location as unknown as InventoryLocation
  }

  async update(id: string, data: any): Promise<InventoryLocation> {
    if (data.isDefault) {
      await prisma.inventoryLocation.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false }
      })
    }
    const location = await prisma.inventoryLocation.update({ where: { id }, data })
    return location as unknown as InventoryLocation
  }

  async delete(id: string): Promise<void> {
    await prisma.inventoryLocation.delete({ where: { id } })
  }
}

export class PrismaInventoryStockRepository implements InventoryStockRepository {
  async findAll(locationId?: string): Promise<InventoryStock[]> {
    const where = locationId ? { locationId } : {}
    const stock = await prisma.inventoryStock.findMany({
      where,
      include: { product: true, location: true },
    })
    return stock as unknown as InventoryStock[]
  }

  async findByProductAndLocation(productId: string, locationId: string): Promise<InventoryStock | null> {
    const stock = await prisma.inventoryStock.findUnique({
      where: { productId_locationId: { productId, locationId } }
    })
    return stock as unknown as InventoryStock | null
  }

  async upsert(productId: string, locationId: string, data: any): Promise<InventoryStock> {
    const stock = await prisma.inventoryStock.upsert({
      where: { productId_locationId: { productId, locationId } },
      update: data,
      create: { productId, locationId, ...data }
    })
    return stock as unknown as InventoryStock
  }

  async updateQuantity(id: string, quantity: number): Promise<InventoryStock> {
    const stock = await prisma.inventoryStock.update({
      where: { id },
      data: { quantity }
    })
    return stock as unknown as InventoryStock
  }
}

export class PrismaInventoryTransferRepository implements InventoryTransferRepository {
  async findAll(options?: any): Promise<InventoryTransfer[]> {
    const { status, limit } = options || {}
    const where: any = {}
    if (status) where.status = status

    const transfers = await prisma.inventoryTransfer.findMany({
      where,
      take: limit || 50,
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    return transfers as unknown as InventoryTransfer[]
  }

  async findById(id: string): Promise<InventoryTransfer | null> {
    const transfer = await prisma.inventoryTransfer.findUnique({
      where: { id },
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
      }
    })
    return transfer as unknown as InventoryTransfer | null
  }

  async create(data: any): Promise<InventoryTransfer> {
    const transfer = await prisma.inventoryTransfer.create({
      data,
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
      }
    })
    return transfer as unknown as InventoryTransfer
  }

  async update(id: string, data: any): Promise<InventoryTransfer> {
    const transfer = await prisma.inventoryTransfer.update({
      where: { id },
      data,
      include: {
        product: true,
        fromLocation: true,
        toLocation: true,
      }
    })
    return transfer as unknown as InventoryTransfer
  }

  async complete(id: string): Promise<InventoryTransfer> {
    const transfer = await prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryTransfer.findUnique({ where: { id } })
      if (!existing) throw new Error('Transfer not found')

      await tx.inventoryStock.upsert({
        where: { productId_locationId: { productId: existing.productId, locationId: existing.toLocationId } },
        update: { quantity: { increment: existing.quantity } },
        create: { productId: existing.productId, locationId: existing.toLocationId, quantity: existing.quantity }
      })

      return tx.inventoryTransfer.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date() },
        include: { product: true, fromLocation: true, toLocation: true }
      })
    })
    return transfer as unknown as InventoryTransfer
  }

  async cancel(id: string): Promise<InventoryTransfer> {
    const transfer = await prisma.inventoryTransfer.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { product: true, fromLocation: true, toLocation: true }
    })
    return transfer as unknown as InventoryTransfer
  }
}
