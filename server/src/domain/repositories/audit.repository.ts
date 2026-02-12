export interface SystemAuditLog {
  id: string
  entityType: string
  entityId: string | null
  action: string
  userId: string | null
  userName: string | null
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export interface AuditRepository {
  create(data: Omit<SystemAuditLog, 'id' | 'createdAt'>, tx?: any): Promise<SystemAuditLog>
  findAll(options: any): Promise<SystemAuditLog[]>
  findByEntity(entityType: string, entityId: string): Promise<SystemAuditLog[]>
  count(where: any): Promise<number>
  deleteOlderThan(date: Date): Promise<number>
}
