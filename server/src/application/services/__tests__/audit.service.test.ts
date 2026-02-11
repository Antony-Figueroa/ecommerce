import { jest } from '@jest/globals'
import { AuditService } from '../audit.service.js'

const mockAuditRepo = {
  create: jest.fn(),
  findAll: jest.fn(),
  findByEntity: jest.fn(),
}

describe('AuditService', () => {
  let auditService: AuditService

  beforeEach(() => {
    jest.clearAllMocks()
    auditService = new AuditService(mockAuditRepo as any)
  })

  describe('logAction', () => {
    it('should log an action successfully', async () => {
      const data = {
        entityType: 'PRODUCT',
        entityId: '123',
        action: 'UPDATE',
        userId: 'user1',
        userName: 'John Doe',
        details: { field: 'price', old: 10, new: 12 },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla'
      }

      mockAuditRepo.create.mockResolvedValue({ id: 'log1', ...data })

      await auditService.logAction(data)

      expect(mockAuditRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'PRODUCT',
        entityId: '123',
        action: 'UPDATE',
        details: JSON.stringify(data.details)
      }))
    })

    it('should handle missing optional fields', async () => {
      const data = {
        entityType: 'LOGIN',
        action: 'SUCCESS'
      }

      await auditService.logAction(data)

      expect(mockAuditRepo.create).toHaveBeenCalledWith({
        entityType: 'LOGIN',
        entityId: null,
        action: 'SUCCESS',
        userId: null,
        userName: null,
        details: null,
        ipAddress: null,
        userAgent: null
      })
    })

    it('should not throw if repository fails', async () => {
      mockAuditRepo.create.mockRejectedValue(new Error('DB Error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      await expect(auditService.logAction({ entityType: 'T', action: 'A' })).resolves.not.toThrow()
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('getLogs', () => {
    it('should return all logs', async () => {
      mockAuditRepo.findAll.mockResolvedValue([{ id: '1' }])
      const result = await auditService.getLogs({ limit: 10 })
      expect(result).toHaveLength(1)
      expect(mockAuditRepo.findAll).toHaveBeenCalledWith({ limit: 10 })
    })
  })

  describe('getEntityLogs', () => {
    it('should return logs for a specific entity', async () => {
      mockAuditRepo.findByEntity.mockResolvedValue([{ id: '2' }])
      const result = await auditService.getEntityLogs('PRODUCT', '123')
      expect(result).toHaveLength(1)
      expect(mockAuditRepo.findByEntity).toHaveBeenCalledWith('PRODUCT', '123')
    })
  })
})
