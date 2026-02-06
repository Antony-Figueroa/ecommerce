import { CartRepository } from '../../domain/repositories/cart.repository.js'
import { NotificationService } from './notification.service.js'
import { EmailService } from './email.service.js'

export class CartService {
  constructor(
    private cartRepo: CartRepository,
    private notificationService: NotificationService,
    private emailService: EmailService
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartRepo.findByUserId(userId)
    if (!cart) {
      cart = await this.cartRepo.create(userId)
    }
    return cart
  }

  async addItem(userId: string, productId: string, quantity: number) {
    const cart = await this.getCart(userId)
    await this.cartRepo.addItem(cart.id, productId, quantity)
    return this.getCart(userId)
  }

  async removeItem(userId: string, productId: string) {
    const cart = await this.getCart(userId)
    await this.cartRepo.removeItem(cart.id, productId)
    return this.getCart(userId)
  }

  async updateQuantity(userId: string, productId: string, quantity: number) {
    const cart = await this.getCart(userId)
    if (quantity <= 0) {
      return this.removeItem(userId, productId)
    }
    await this.cartRepo.updateItemQuantity(cart.id, productId, quantity)
    return this.getCart(userId)
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId)
    await this.cartRepo.clear(cart.id)
    return this.getCart(userId)
  }

  async checkAbandonedCarts() {
    // Definir el umbral (ej: 24 horas de inactividad)
    const threshold = new Date()
    threshold.setHours(threshold.getHours() - 24)

    const abandonedCarts = await this.cartRepo.findAbandonedCarts(threshold)

    for (const cart of abandonedCarts) {
      const itemCount = cart.items.length
      const firstItemName = cart.items[0]?.product.name
      const user = cart.user // Asumiendo que el repositorio incluye el usuario

      // 1. Notificación en tiempo real / Campana
      await this.notificationService.createNotification({
        type: 'CART_REMINDER',
        category: 'SYSTEM',
        priority: 'NORMAL',
        title: '¡No olvides tu carrito!',
        message: `Tienes ${itemCount} productos esperando por ti${firstItemName ? `, incluyendo ${firstItemName}` : ''}. ¡Completa tu compra ahora!`,
        userId: cart.userId,
        link: '/cart',
        metadata: JSON.stringify({ cartId: cart.id })
      })

      // 2. Notificación por Email
      if (user && user.email) {
        await this.emailService.sendAbandonedCartEmail(
          user.email,
          user.name || 'Cliente',
          cart.items
        )
      }

      await this.cartRepo.markReminderSent(cart.id)
    }
  }
}
