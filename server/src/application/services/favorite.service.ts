import { FavoriteRepository } from '../../domain/repositories/favorite.repository.js'
import { NotificationService } from './notification.service.js'

export class FavoriteService {
  constructor(
    private favoriteRepo: FavoriteRepository,
    private notificationService: NotificationService
  ) {}

  async getFavorites(userId: string) {
    const favorites = await this.favoriteRepo.findAllByUserId(userId)
    return favorites.map((f: any) => f.product)
  }

  async checkFavorite(userId: string, productId: string) {
    const favorite = await this.favoriteRepo.findUnique(userId, productId)
    return !!favorite
  }

  async addFavorite(userId: string, productId: string) {
    const favorite = await this.favoriteRepo.upsert(userId, productId)
    return favorite
  }

  async notifyPriceDrop(productId: string, oldPrice: number, newPrice: number) {
    if (newPrice >= oldPrice) return

    const interestedUsers = await this.favoriteRepo.findAllByProductId(productId)
    const product = await this.favoriteRepo.findProductById(productId) // Asumimos que existe este helper o lo buscamos vía productRepo

    for (const fav of interestedUsers) {
      await this.notificationService.createNotification({
        type: 'PRICE_DROP',
        category: 'FAVORITES',
        priority: 'NORMAL',
        title: '¡Bajada de precio!',
        message: `El producto ${product.name} ha bajado de precio de $${oldPrice} a $${newPrice}. ¡Aprovecha ahora!`,
        userId: fav.userId,
        link: `/product/${product.slug}`,
        metadata: JSON.stringify({ productId, oldPrice, newPrice })
      })
    }
  }

  async removeFavorite(userId: string, productId: string) {
    await this.favoriteRepo.delete(userId, productId)
  }
}
