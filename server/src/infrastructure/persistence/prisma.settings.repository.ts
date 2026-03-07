import { prisma } from './prisma.client.js'
import { BCVRepository, BCVRate, SettingsRepository, Setting, SettingHistory } from '../../domain/repositories/settings.repository.js'

export class PrismaBCVRepository implements BCVRepository {
  private mapBCVRate(record: any): BCVRate {
    return {
      id: record.id,
      rate: Number(record.rate),
      source: record.source,
      isActive: record.isActive,
      createdAt: record.createdAt,
    }
  }

  async getCurrentRate(): Promise<number> {
    const latestRate = await prisma.bCVRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return Number(latestRate?.rate || 0)
  }

  async getLatestRateRecord(): Promise<BCVRate | null> {
    const record = await prisma.bCVRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return record ? this.mapBCVRate(record) : null
  }

  async setRate(rate: number, source = 'manual'): Promise<BCVRate> {
    const record = await prisma.bCVRate.create({
      data: {
        rate,
        source,
        isActive: true,
      },
    })
    return this.mapBCVRate(record)
  }

  async getRateHistory(limit = 50): Promise<BCVRate[]> {
    const records = await prisma.bCVRate.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return records.map(r => this.mapBCVRate(r))
  }

  async findById(id: string): Promise<BCVRate | null> {
    const record = await prisma.bCVRate.findUnique({ where: { id } })
    return record ? this.mapBCVRate(record) : null
  }

  async update(id: string, data: Partial<BCVRate>): Promise<BCVRate> {
    const record = await prisma.bCVRate.update({
      where: { id },
      data,
    })
    return this.mapBCVRate(record)
  }

  async deactivateAll(): Promise<void> {
    await prisma.bCVRate.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })
  }
}

export class PrismaSettingsRepository implements SettingsRepository {
  async findAll(): Promise<Setting[]> {
    return prisma.setting.findMany({
      orderBy: [
        { group: 'asc' },
        { label: 'asc' }
      ]
    }) as Promise<Setting[]>
  }

  async findPublic(): Promise<Setting[]> {
    return prisma.setting.findMany({
      where: { isPublic: true }
    }) as Promise<Setting[]>
  }

  async findByKey(key: string): Promise<Setting | null> {
    return prisma.setting.findUnique({ where: { key } }) as Promise<Setting | null>
  }

  async findById(id: string): Promise<Setting | null> {
    return prisma.setting.findUnique({ where: { id } }) as Promise<Setting | null>
  }

  async update(id: string, value: string): Promise<Setting> {
    return prisma.setting.update({
      where: { id },
      data: { value }
    }) as Promise<Setting>
  }

  async getHistory(key: string): Promise<any[]> {
    const setting = await prisma.setting.findUnique({
      where: { key },
      include: {
        history: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    return setting?.history || []
  }

  async createHistory(data: Omit<SettingHistory, 'id' | 'createdAt'>): Promise<SettingHistory> {
    return prisma.settingHistory.create({
      data
    }) as Promise<SettingHistory>
  }

  async findHistoryById(id: string): Promise<(SettingHistory & { setting: Setting }) | null> {
    return prisma.settingHistory.findUnique({
      where: { id },
      include: { setting: true }
    }) as Promise<(SettingHistory & { setting: Setting }) | null>
  }

  async updateManyWithHistory(updates: { key: string; value: string; reason?: string }[], userId: string): Promise<Setting[]> {
    return await prisma.$transaction(async (tx) => {
      const results: Setting[] = []

      for (const update of updates) {
        const setting = await tx.setting.findUnique({ where: { key: update.key } })

        if (!setting) {
          throw new Error(`Configuración no encontrada: ${update.key}`)
        }

        if (setting.value === String(update.value)) continue

        await tx.settingHistory.create({
          data: {
            settingId: setting.id,
            oldValue: setting.value,
            newValue: String(update.value),
            userId,
            reason: update.reason || 'Actualización manual'
          }
        })

        const updated = await tx.setting.update({
          where: { id: setting.id },
          data: { value: String(update.value) }
        })

        results.push(updated as Setting)
      }

      return results
    })
  }
}
