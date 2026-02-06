import { prisma } from './prisma.client.js'
import { Category, Brand, InventoryLog, CategoryRepository, BrandRepository, InventoryLogRepository } from '../../domain/repositories/inventory.repository.js'

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

  async create(data: any): Promise<Category> {
    const category = await prisma.category.create({ data })
    return category as unknown as Category
  }

  async update(id: string, data: any): Promise<Category> {
    const category = await prisma.category.update({ where: { id }, data })
    return category as unknown as Category
  }

  async delete(id: string): Promise<void> {
    await prisma.category.delete({ where: { id } })
  }

  async upsert(slug: string, data: any): Promise<Category> {
    const { name, ...rest } = data
    const category = await prisma.category.upsert({
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

  async upsert(name: string): Promise<Brand> {
    const brand = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    return brand as unknown as Brand
  }
}

export class PrismaInventoryLogRepository implements InventoryLogRepository {
  async create(data: any): Promise<InventoryLog> {
    const log = await prisma.inventoryLog.create({ data })
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
