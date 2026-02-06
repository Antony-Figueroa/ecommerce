import { BCVRepository } from '../../domain/repositories/settings.repository.js'
import { NotFoundError } from '../../shared/errors/app.errors.js'

export class BCVService {
  constructor(private bcvRepo: BCVRepository) {}

  async getCurrentRate(): Promise<number> {
    return this.bcvRepo.getCurrentRate()
  }

  async getLatestRateRecord() {
    return this.bcvRepo.getLatestRateRecord()
  }

  async setRate(rate: number, source = 'manual') {
    await this.bcvRepo.deactivateAll()
    return this.bcvRepo.setRate(rate, source)
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
