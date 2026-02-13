import { prisma } from './prisma.client.js'
import { Category, Brand, InventoryLog, CategoryRepository, BrandRepository, InventoryLogRepository, Provider, ProviderRepository, InventoryBatchRepository } from '../../domain/repositories/inventory.repository.js'

export class PrismaCategoryRepository implements CategoryRepository {
  async findAll(options?: any): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      ...options,
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
    const log = await client.inventoryLog.create({ data })
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
  async findMany(options?: any) {
    return prisma.inventoryBatch.findMany({
      ...options,
      include: {
        provider: true,
        items: {
          include: {
            product: true,
          },
          orderBy: { entryDate: 'asc' }
        }
      },
      orderBy: options?.orderBy || { createdAt: 'desc' },
    })
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

  async create(data: any) {
    return prisma.inventoryBatch.create({
      data,
      include: {
        provider: true,
        items: {
          include: { product: true }
        }
      }
    })
  }

  async update(id: string, data: any) {
    return prisma.inventoryBatch.update({
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

  async findAvailableItemsByProduct(productId: string) {
    return prisma.inventoryBatchItem.findMany({
      where: {
        productId,
        quantity: { gt: 0 }
      },
      orderBy: { entryDate: 'asc' }
    })
  }

  async updateItem(id: string, data: any) {
    return prisma.inventoryBatchItem.update({
      where: { id },
      data
    })
  }
}
