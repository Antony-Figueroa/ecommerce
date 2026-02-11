import { AuditRepository } from '../../domain/repositories/audit.repository.js'

export class AuditService {
  constructor(private auditRepo: AuditRepository) {}

  async logAction(data: {
    entityType: string
    entityId?: string
    action: string
    userId?: string
    userName?: string
    details?: any
    ipAddress?: string
    userAgent?: string
  }) {
    try {
      return await this.auditRepo.create({
        entityType: data.entityType,
        entityId: data.entityId || null,
        action: data.action,
        userId: data.userId || null,
        userName: data.userName || null,
        details: data.details ? JSON.stringify(data.details) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null
      })
    } catch (error) {
      console.error('Error logging audit action:', error)
      // We don't throw to avoid breaking the main flow
    }
  }

  async getLogs(options: any = {}) {
    return this.auditRepo.findAll(options)
  }

  async getEntityLogs(entityType: string, entityId: string) {
    return this.auditRepo.findByEntity(entityType, entityId)
  }

  /**
   * Limpia logs antiguos según la política de retención (GDPR)
   * @param days Días de retención (por defecto 365)
   */
  async cleanupOldLogs(days: number = 365) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const count = await this.auditRepo.deleteOlderThan(cutoffDate)
    
    // Log the cleanup action itself
    await this.logAction({
      entityType: 'SYSTEM',
      action: 'AUDIT_CLEANUP',
      details: { days, deletedCount: count }
    })
    
    return count
  }
}
