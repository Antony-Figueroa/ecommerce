import { prisma } from '../lib/prisma.js'
import { NotFoundError } from '../utils/errors.js'

export class BCVService {
  static async getCurrentRate(): Promise<number> {
    const latestRate = await prisma.bCVRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return Number(latestRate?.rate || 0)
  }

  static async getLatestRateRecord() {
    return prisma.bCVRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async setRate(rate: number, source = 'manual') {
    await prisma.bCVRate.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    })

    return prisma.bCVRate.create({
      data: {
        rate,
        source,
        isActive: true,
      },
    })
  }

  static async getRateHistory(limit = 50) {
    return prisma.bCVRate.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  static async deactivateRate(id: string) {
    const rate = await prisma.bCVRate.findUnique({ where: { id } })
    if (!rate) {
      throw new NotFoundError('Tasa BCV')
    }
    return prisma.bCVRate.update({
      where: { id },
      data: { isActive: false },
    })
  }
}
