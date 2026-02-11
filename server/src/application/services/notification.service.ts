import { NotificationRepository, BatchRepository, NotificationSettingRepository } from '../../domain/repositories/business.repository.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { NotificationManager } from './notification-manager.service.js'

export class NotificationService {
  constructor(
    private notificationRepo: NotificationRepository,
    private productRepo: ProductRepository,
    private batchRepo: BatchRepository,
    private notificationManager: NotificationManager,
    private settingRepo?: NotificationSettingRepository
  ) {}

  async createNotification(data: {
    type: string
    priority?: string
    category?: string
    title: string
    message: string
    userId?: string
    link?: string
    metadata?: string
  }) {
    return this.notificationManager.createNotification(data)
  }

  async getUnreadNotifications(userId?: string) {
    return this.notificationRepo.findUnread(userId)
  }

  async getAllNotifications(userId?: string, category?: string, limit?: number, skip?: number) {
    return this.notificationRepo.findAll({ userId, category, limit, skip })
  }

  async countNotifications(userId?: string, category?: string) {
    return this.notificationRepo.count(userId, category)
  }

  async markAsRead(id: string) {
    return this.notificationRepo.update(id, { isRead: true })
  }

  async markAllAsRead(userId?: string, category?: string) {
    return this.notificationRepo.markAllAsRead(userId, category)
  }

  async deleteNotification(id: string) {
    return this.notificationRepo.delete(id)
  }

  async checkLowStock() {
    return this.notificationManager.checkLowStock()
  }

  async checkExpirations() {
    return this.notificationManager.checkExpirations()
  }
}
