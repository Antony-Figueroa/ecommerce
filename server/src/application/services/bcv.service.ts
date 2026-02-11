import { BCVRepository } from '../../domain/repositories/settings.repository.js'
import { NotFoundError } from '../../shared/errors/app.errors.js'
import { AuditService } from './audit.service.js'

export class BCVService {
  constructor(
    private bcvRepo: BCVRepository,
    private auditService: AuditService
  ) {}

  async getCurrentRate(): Promise<number> {
    return this.bcvRepo.getCurrentRate()
  }

  async getLatestRateRecord() {
    return this.bcvRepo.getLatestRateRecord()
  }

  async setRate(rate: number, source = 'manual', userId?: string, ipAddress?: string, userAgent?: string) {
    const previousRate = await this.bcvRepo.getCurrentRate()
    await this.bcvRepo.deactivateAll()
    const newRate = await this.bcvRepo.setRate(rate, source)

    // GDPR Compliant Audit
    await this.auditService.logAction({
      entityType: 'BCV_RATE',
      entityId: newRate.id,
      action: 'UPDATE',
      userId,
      details: { previousRate, newRate: rate, source },
      ipAddress,
      userAgent
    })

    return newRate
  }

  async getRateHistory(limit = 50) {
    return this.bcvRepo.getRateHistory(limit)
  }

  async deactivateRate(id: string) {
    const rate = await this.bcvRepo.findById(id)
    if (!rate) {
      throw new NotFoundError('Tasa BCV')
    }
    return this.bcvRepo.update(id, { isActive: false })
  }
}
