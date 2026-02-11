import { jest } from '@jest/globals'
import { NotificationService } from '../notification.service.js'

describe('NotificationService', () => {
  let notificationService: NotificationService
  let mockNotificationRepo: any
  let mockProductRepo: any
  let mockBatchRepo: any
  let mockNotificationManager: any
  let mockSettingRepo: any

  beforeEach(() => {
    mockNotificationRepo = {
      create: jest.fn(),
      findUnread: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      markAllAsRead: jest.fn(),
      delete: jest.fn(),
    }
    mockProductRepo = {}
    mockBatchRepo = {}
    mockNotificationManager = {
      createNotification: jest.fn(),
      checkLowStock: jest.fn(),
      checkExpirations: jest.fn(),
    }
    mockSettingRepo = {}

    notificationService = new NotificationService(
      mockNotificationRepo,
      mockProductRepo,
      mockBatchRepo,
      mockNotificationManager,
      mockSettingRepo
    )
  })

  describe('createNotification', () => {
    it('should delegate to notificationManager', async () => {
      const data = { type: 'INFO', title: 'T', message: 'M' }
      await notificationService.createNotification(data)
      expect(mockNotificationManager.createNotification).toHaveBeenCalledWith(data)
    })
  })

  describe('markAsRead', () => {
    it('should call repo update', async () => {
      await notificationService.markAsRead('n1')
      expect(mockNotificationRepo.update).toHaveBeenCalledWith('n1', { isRead: true })
    })
  })

  describe('checkLowStock', () => {
    it('should delegate to manager', async () => {
      await notificationService.checkLowStock()
      expect(mockNotificationManager.checkLowStock).toHaveBeenCalled()
    })
  })
})
