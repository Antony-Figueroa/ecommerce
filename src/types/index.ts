export interface ProductImage {
  id: string
  url: string
  thumbnail?: string | null
  medium?: string | null
  large?: string | null
  isMain: boolean
  sortOrder: number
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string
  price: number
  purchasePrice?: number
  shippingCost?: number
  profitMargin?: number
  image?: string | null
  images?: ProductImage[]
  categoryIds: string[]
  brand: string
  format: string
  weight?: string | null
  stock: number
  minStock?: number
  inStock: boolean
  isActive: boolean
  isFeatured: boolean
  isOffer: boolean
  originalPrice?: number | null
  createdAt?: string
  updatedAt?: string
  category?: Category
  categories?: Category[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  icon?: string | null
  isActive: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface Sale {
  id: string
  saleNumber: string
  userId?: string | null
  customerName?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  deliveryAddress?: string | null
  paymentMethod: string
  status: string
  subtotalUSD: number
  shippingCostUSD: number
  totalUSD: number
  taxUSD?: number
  bcvRate: number
  totalBS: number
  profitUSD: number
  profitBS: number
  isPaid: boolean
  paidAmountUSD?: number | null
  deliveryStatus: string
  notes?: string | null
  items: SaleItem[]
  auditLogs?: SaleAuditLog[]
  createdAt: string
  updatedAt?: string
}

export interface SaleItem {
  id: string
  saleId: string
  productId: string
  name: string
  quantity: number
  originalQuantity?: number | null
  unitCost: number
  unitPrice: number
  total: number
  profitPerUnit: number
  totalProfit: number
  status?: string
  product?: Product
}

export interface SaleAuditLog {
  id: string
  saleId: string
  action: string
  oldStatus?: string | null
  newStatus?: string | null
  oldDeliveryStatus?: string | null
  newDeliveryStatus?: string | null
  userId?: string | null
  reason?: string | null
  createdAt: string
}

export interface Requirement {
  id: string
  code: string
  supplier: string
  status: string
  subtotalUSD: number
  totalUSD: number
  notes?: string | null
  items: RequirementItem[]
  createdAt: string
  updatedAt?: string
}

export interface RequirementItem {
  id: string
  requirementId: string
  productId: string
  name: string
  quantity: number
  unitCost: number
  total: number
}

export interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  avatarUrl?: string | null
  phone?: string | null
  address?: string | null
}

export interface AuthResponse {
  success: boolean
  token: string
  user: User
}

export interface PaginatedResponse<T> {
  products?: T[]
  requirements?: T[]
  sales?: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface BCVRate {
  id: string
  rate: number
  source: string
  isActive: boolean
  validFrom: string
}
