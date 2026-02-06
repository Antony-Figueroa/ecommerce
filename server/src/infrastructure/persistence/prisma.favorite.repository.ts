import { prisma } from './prisma.client.js'
import { Favorite, FavoriteRepository } from '../../domain/repositories/favorite.repository.js'

export class PrismaFavoriteRepository implements FavoriteRepository {
  async findAllByUserId(userId: string): Promise<any[]> {
    try {
      return await prisma.favorite.findMany({
        where: { userId },
        include: {
          product: {
            include: {
              categories: true,
              images: {
                orderBy: { sortOrder: 'asc' }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      console.error('Error in PrismaFavoriteRepository.findAllByUserId:', error)
      throw error
    }
  }

  async findAllByProductId(productId: string): Promise<any[]> {
    return prisma.favorite.findMany({
      where: { productId },
      include: {
        user: true
      }
    })
  }

  async findUnique(userId: string, productId: string): Promise<Favorite | null> {
    return prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })
  }

  async upsert(userId: string, productId: string): Promise<Favorite> {
    return prisma.favorite.upsert({
      where: {
        userId_productId: {
          userId,
          productId
        }
      },
      update: {},
      create: {
        userId,
        productId
      }
    })
  }

  async delete(userId: string, productId: string): Promise<void> {
    await prisma.favorite.delete({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    })
  }

  async findProductById(productId: string): Promise<any | null> {
    return prisma.product.findUnique({
      where: { id: productId }
    })
  }
}
