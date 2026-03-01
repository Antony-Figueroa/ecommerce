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
  _count?: {
    batches: number
  }
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
  create(data: any, tx?: any): Promise<Provider>
  update(id: string, data: any, tx?: any): Promise<Provider>
  delete(id: string, tx?: any): Promise<void>
}

export interface InventoryBatchRepository {
  findAll(options?: any): Promise<any[]>
  findById(id: string): Promise<any | null>
  create(data: any, tx?: any): Promise<any>
  update(id: string, data: any, tx?: any): Promise<any>
  delete(id: string, tx?: any): Promise<void>
<<<<<<< HEAD
  findAvailableItemsByProduct(productId: string, tx?: any): Promise<any[]>
  updateItem(id: string, data: any, tx?: any): Promise<any>
}

export interface InventoryLocation {
  id: string
  name: string
  description?: string | null
  address?: string | null
  isActive: boolean
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface InventoryStock {
  id: string
  productId: string
  locationId: string
  quantity: number
  minStock: number
  maxStock: number
  updatedAt: Date
}

export interface InventoryTransfer {
  id: string
  fromLocationId: string
  toLocationId: string
  productId: string
  quantity: number
  status: string
  notes?: string | null
  createdAt: Date
  completedAt?: Date | null
}

export interface InventoryLocationRepository {
  findAll(): Promise<InventoryLocation[]>
  findById(id: string): Promise<InventoryLocation | null>
  findDefault(): Promise<InventoryLocation | null>
  create(data: any): Promise<InventoryLocation>
  update(id: string, data: any): Promise<InventoryLocation>
  delete(id: string): Promise<void>
}

export interface InventoryStockRepository {
  findAll(locationId?: string): Promise<InventoryStock[]>
  findByProductAndLocation(productId: string, locationId: string): Promise<InventoryStock | null>
  upsert(productId: string, locationId: string, data: any): Promise<InventoryStock>
  updateQuantity(id: string, quantity: number): Promise<InventoryStock>
}

export interface InventoryTransferRepository {
  findAll(options?: any): Promise<InventoryTransfer[]>
  findById(id: string): Promise<InventoryTransfer | null>
  create(data: any): Promise<InventoryTransfer>
  update(id: string, data: any): Promise<InventoryTransfer>
  complete(id: string): Promise<InventoryTransfer>
  cancel(id: string): Promise<InventoryTransfer>
=======
  findAvailableItemsByProduct(productId: string): Promise<any[]>
  updateItem(id: string, data: any, tx?: any): Promise<any>
>>>>>>> 37a79b4a653cb93bfe53cae63909f30b68df9a60
}
