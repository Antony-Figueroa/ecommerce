// Temporary type declarations for Prisma client
// TODO: Regenerate Prisma client when file permissions allow

declare module '@prisma/client' {
  export interface User {
    id: string
    email: string
    passwordHash: string | null
    username: string | null
    googleId: string | null
    avatarUrl: string | null
    role: string
    isActive: boolean
    emailVerified: boolean
    verificationToken: string | null
    verificationTokenExpires: Date | null
    resetPasswordToken: string | null
    resetPasswordExpires: Date | null
    createdAt: Date
    updatedAt: Date
    name: string | null
    phone: string | null
    address: string | null
  }

  export interface Cart {
    id: string
    userId: string
    createdAt: Date
    updatedAt: Date
    lastInteraction: Date
    reminderSent: boolean
    lastReminderSent: Date | null
  }

  export interface CartItem {
    id: string
    cartId: string
    productId: string
    quantity: number
    createdAt: Date
    updatedAt: Date
  }

  export interface Product {
    id: string
    sku: string
    productCode: string | null
    name: string
    slug: string
    description: string
    price: any
    currency: string
    purchasePrice: any
    profitMargin: any
    image: string | null
    brand: string
    format: string
    weight: string | null
    stock: number
    minStock: number
    inStock: boolean
    isActive: boolean
    isFeatured: boolean
    isOffer: boolean
    originalPrice: any
    createdAt: Date
    updatedAt: Date
    brandId: string | null
  }

  export interface NotificationSetting {
    id: string
    userId: string
    orderConfirmation: boolean
    shippingUpdates: boolean
    promotional: boolean
    lowStockAlerts: boolean
    createdAt: Date
    updatedAt: Date
  }

  export interface Setting {
    id: string
    key: string
    value: string
    group: string | null
    type: string
    description: string | null
    isPublic: boolean
    createdAt: Date
    updatedAt: Date
  }
}
