import { prisma } from './prisma.client.js'
import { AuditRepository, SystemAuditLog } from '../../domain/repositories/audit.repository.js'

export class PrismaAuditRepository implements AuditRepository {
  async create(data: Omit<SystemAuditLog, 'id' | 'createdAt'>): Promise<SystemAuditLog> {
    const log = await prisma.systemAuditLog.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        userId: data.userId,
        userName: data.userName,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    })
    return log as SystemAuditLog
  }

  async findAll(options: any): Promise<SystemAuditLog[]> {
    const logs = await prisma.systemAuditLog.findMany({
      ...options,
      orderBy: { createdAt: 'desc' }
    })
    return logs as SystemAuditLog[]
  }

  async findByEntity(entityType: string, entityId: string): Promise<SystemAuditLog[]> {
    const logs = await prisma.systemAuditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' }
    })
    return logs as SystemAuditLog[]
  }

  async count(where: any): Promise<number> {
    return prisma.systemAuditLog.count({ where })
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const result = await prisma.systemAuditLog.deleteMany({
      where: {
        createdAt: {
          lt: date
        }
      }
    })
    return result.count
  }
}
