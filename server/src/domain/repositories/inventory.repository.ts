export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  icon: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  _count?: {
    products: number
  }
}

export interface Brand {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface InventoryLog {
  id: string
  productId: string
  changeType: string
  previousStock: number
  newStock: number
  changeAmount: number
  reason: string | null
  createdAt: Date
}

export interface Provider {
  id: string
  name: string
  country?: string | null
  address?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface InventoryBatch {
  id: string
  code: string
  providerId?: string | null
  notes?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface InventoryBatchItem {
  id: string
  batchId: string
  productId: string
  quantity: number
  soldQuantity: number
  unitCostUSD: number
  unitSaleUSD: number
  entryDate: Date
  discounted: boolean
  discountPercent: number
}

export interface CategoryRepository {
  findAll(options?: any): Promise<Category[]>
  findFirst(options: any): Promise<Category | null>
  findById(id: string): Promise<Category | null>
  findBySlug(slug: string): Promise<Category | null>
  findByName(name: string): Promise<Category | null>
  create(data: any, tx?: any): Promise<Category>
  update(id: string, data: any, tx?: any): Promise<Category>
  delete(id: string, tx?: any): Promise<void>
  upsert(slug: string, data: any, tx?: any): Promise<Category>
}

export interface BrandRepository {
  findAll(): Promise<Brand[]>
  findById(id: string): Promise<Brand | null>
  findByName(name: string): Promise<Brand | null>
  upsert(name: string, tx?: any): Promise<Brand>
}

export interface InventoryLogRepository {
  create(data: any, tx?: any): Promise<InventoryLog>
  findAll(productId?: string): Promise<InventoryLog[]>
}

export interface ProviderRepository {
  findAll(): Promise<Provider[]>
  findById(id: string): Promise<Provider | null>
  findByName(name: string): Promise<Provider | null>
  create(data: any): Promise<Provider>
  update(id: string, data: any): Promise<Provider>
  delete(id: string): Promise<void>
}

export interface InventoryBatchRepository {
  findMany(options?: any): Promise<any[]>
  findById(id: string): Promise<any | null>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  findAvailableItemsByProduct(productId: string): Promise<any[]>
  updateItem(id: string, data: any): Promise<any>
}
