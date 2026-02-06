export interface BCVRate {
  id: string
  rate: number
  source: string
  isActive: boolean
  createdAt: Date
}

export interface BCVRepository {
  getCurrentRate(): Promise<number>
  getLatestRateRecord(): Promise<BCVRate | null>
  setRate(rate: number, source?: string): Promise<BCVRate>
  getRateHistory(limit?: number): Promise<BCVRate[]>
  findById(id: string): Promise<BCVRate | null>
  update(id: string, data: Partial<BCVRate>): Promise<BCVRate>
  deactivateAll(): Promise<void>
}

export interface Setting {
  id: string
  key: string
  value: string
  label: string
  group: string
  type: string
  isPublic: boolean
  updatedAt: Date
}

export interface SettingHistory {
  id: string
  settingId: string
  oldValue: string
  newValue: string
  userId: string
  reason: string
  createdAt: Date
}

export interface SettingsRepository {
  findAll(): Promise<Setting[]>
  findPublic(): Promise<Setting[]>
  findByKey(key: string): Promise<Setting | null>
  update(id: string, value: string): Promise<Setting>
  getHistory(key: string): Promise<any[]>
  createHistory(data: Omit<SettingHistory, 'id' | 'createdAt'>): Promise<SettingHistory>
  findById(id: string): Promise<Setting | null>
  findHistoryById(id: string): Promise<(SettingHistory & { setting: Setting }) | null>
  updateManyWithHistory(updates: { key: string; value: string; reason?: string }[], userId: string): Promise<Setting[]>
}
