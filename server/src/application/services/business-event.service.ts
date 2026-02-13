import { BusinessEventRepository, NotificationRepository } from '../../domain/repositories/business.repository.js'
import { NotificationManager } from './notification-manager.service.js'

export class BusinessEventService {
  constructor(
    private businessEventRepo: BusinessEventRepository,
    private notificationManager: NotificationManager
  ) {}

  async createEvent(data: {
    type: string
    title: string
    description?: string
    date: Date
    amount?: number
    status?: string
    isFuture?: boolean
    userId?: string
  }) {
    const event = await this.businessEventRepo.create(data)

    // If it's a future event, we might want to schedule an alert or just wait for the cron job
    // For now, if it's not future, it's just a log of an action
    return event
  }

  async getEvents(options: {
    startDate?: string
    endDate?: string
    type?: string
    userId?: string
    isFuture?: boolean
  }) {
    const { startDate, endDate, ...rest } = options
    return this.businessEventRepo.findAll({
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    })
  }

  async getEventById(id: string) {
    return this.businessEventRepo.findById(id)
  }

  async updateEvent(id: string, data: any) {
    return this.businessEventRepo.update(id, data)
  }

  async deleteEvent(id: string) {
    return this.businessEventRepo.delete(id)
  }

  async checkPendingAlerts() {
    const now = new Date()
    const pendingEvents = await this.businessEventRepo.findPendingAlerts(now)

    for (const event of pendingEvents) {
      await this.notificationManager.createNotification({
        type: 'ALERT',
        priority: 'HIGH',
        category: 'SYSTEM',
        title: `Recordatorio: ${event.title}`,
        message: event.description || `Evento programado para hoy: ${event.title}`,
        userId: event.userId,
        metadata: JSON.stringify({ eventId: event.id })
      })

      await this.businessEventRepo.markAlertSent(event.id)
    }

    return pendingEvents.length
  }

  /**
   * Syncs existing notifications and sales to business events if needed
   * This is useful for populating the calendar with historical data
   */
  async syncHistoricalData() {
    // This could be a one-time migration or periodic sync
    // For now, we'll implement it as a helper if needed
  }
}
