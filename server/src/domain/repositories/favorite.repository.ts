export interface Favorite {
  userId: string
  productId: string
  createdAt: Date
}

export interface FavoriteRepository {
  findAllByUserId(userId: string): Promise<any[]>
  findUnique(userId: string, productId: string): Promise<Favorite | null>
  upsert(userId: string, productId: string): Promise<Favorite>
  delete(userId: string, productId: string): Promise<void>
}
