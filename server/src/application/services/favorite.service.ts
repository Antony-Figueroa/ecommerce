import { FavoriteRepository } from '../../domain/repositories/favorite.repository.js'

export class FavoriteService {
  constructor(private favoriteRepo: FavoriteRepository) {}

  async getFavorites(userId: string) {
    const favorites = await this.favoriteRepo.findAllByUserId(userId)
    return favorites.map((f: any) => f.product)
  }

  async checkFavorite(userId: string, productId: string) {
    const favorite = await this.favoriteRepo.findUnique(userId, productId)
    return !!favorite
  }

  async addFavorite(userId: string, productId: string) {
    return this.favoriteRepo.upsert(userId, productId)
  }

  async removeFavorite(userId: string, productId: string) {
    await this.favoriteRepo.delete(userId, productId)
  }
}
