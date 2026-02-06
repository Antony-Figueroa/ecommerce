import type { Cart, CartItem, Product, User } from '@prisma/client'

export type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product
  })[]
  user?: User
}

export interface CartRepository {
  findByUserId(userId: string): Promise<CartWithItems | null>
  create(userId: string): Promise<CartWithItems>
  updateLastInteraction(cartId: string): Promise<void>
  addItem(cartId: string, productId: string, quantity: number): Promise<void>
  removeItem(cartId: string, productId: string): Promise<void>
  updateItemQuantity(cartId: string, productId: string, quantity: number): Promise<void>
  clear(cartId: string): Promise<void>
  findAbandonedCarts(threshold: Date): Promise<CartWithItems[]>
  markReminderSent(cartId: string): Promise<void>
}
