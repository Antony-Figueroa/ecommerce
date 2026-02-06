import { prisma } from './prisma.client.js'
import { Cart, CartItem } from '@prisma/client'
import { CartRepository, CartWithItems } from '../../domain/repositories/cart.repository.js'

export class PrismaCartRepository implements CartRepository {
  async findByUserId(userId: string): Promise<CartWithItems | null> {
    return prisma.cart.findUnique({
      where: { userId },
      include: {
        items: { include: { product: true } },
        user: true
      }
    }) as Promise<CartWithItems | null>
  }

  async create(userId: string): Promise<CartWithItems> {
    return prisma.cart.create({
      data: { userId },
      include: {
        items: { include: { product: true } },
        user: true
      }
    }) as Promise<CartWithItems>
  }

  async updateLastInteraction(cartId: string): Promise<void> {
    await prisma.cart.update({
      where: { id: cartId },
      data: { updatedAt: new Date() }
    })
  }

  async addItem(cartId: string, productId: string, quantity: number): Promise<void> {
    await prisma.cartItem.upsert({
      where: {
        cartId_productId: { cartId, productId }
      },
      update: {
        quantity: { increment: quantity }
      },
      create: {
        cartId,
        productId,
        quantity
      }
    })
  }

  async removeItem(cartId: string, productId: string): Promise<void> {
    await prisma.cartItem.delete({
      where: {
        cartId_productId: { cartId, productId }
      }
    })
  }

  async updateItemQuantity(cartId: string, productId: string, quantity: number): Promise<void> {
    await prisma.cartItem.update({
      where: {
        cartId_productId: { cartId, productId }
      },
      data: { quantity }
    })
  }

  async clear(cartId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: { cartId }
    })
  }

  async findAbandonedCarts(threshold: Date): Promise<CartWithItems[]> {
    return prisma.cart.findMany({
      where: {
        updatedAt: { lt: threshold },
        items: { some: {} },
        lastReminderSent: null
      },
      include: {
        items: { include: { product: true } },
        user: true
      }
    }) as Promise<CartWithItems[]>
  }

  async markReminderSent(cartId: string): Promise<void> {
    await prisma.cart.update({
      where: { id: cartId },
      data: { lastReminderSent: new Date() }
    })
  }
}
