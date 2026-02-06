import { prisma } from './prisma.client.js'
import { NotificationSetting } from '@prisma/client'
import { NotificationSettingRepository } from '../../domain/repositories/business.repository.js'

export class PrismaNotificationSettingRepository implements NotificationSettingRepository {
  async findByUserId(userId: string) {
    return prisma.notificationSetting.findUnique({
      where: { userId }
    })
  }

  async upsert(userId: string, data: {
    orders?: boolean
    favorites?: boolean
    promotions?: boolean
    system?: boolean
  }) {
    return prisma.notificationSetting.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
        orders: data.orders ?? true,
        favorites: data.favorites ?? true,
        promotions: data.promotions ?? true,
        system: data.system ?? true,
      }
    })
  }
}
