import { NotificationSettingRepository } from '../../domain/repositories/business.repository.js'

export class NotificationSettingService {
  constructor(private settingRepo: NotificationSettingRepository) {}

  async getSettings(userId: string) {
    let settings = await this.settingRepo.findByUserId(userId)
    
    if (!settings) {
      // Si no existen, creamos unos por defecto
      settings = await this.settingRepo.upsert(userId, {
        orders: true,
        favorites: true,
        promotions: true,
        system: true
      })
    }
    
    return settings
  }

  async updateSettings(userId: string, data: {
    orders?: boolean
    favorites?: boolean
    promotions?: boolean
    system?: boolean
  }) {
    return this.settingRepo.upsert(userId, data)
  }
}
