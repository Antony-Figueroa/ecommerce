import { RequirementService } from '../requirement.service.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/app.errors.js';

describe('RequirementService', () => {
  let requirementService: RequirementService;
  let mockRequirementRepo: any;
  let mockProductRepo: any;
  let mockBatchRepo: any;
  let mockLogRepo: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockRequirementRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getSummary: jest.fn(),
    };
    mockProductRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    mockBatchRepo = {
      create: jest.fn(),
    };
    mockLogRepo = {
      create: jest.fn(),
    };
    mockAuditService = {
      logAction: jest.fn(),
    };

    requirementService = new RequirementService(
      mockRequirementRepo,
      mockProductRepo,
      mockBatchRepo,
      mockLogRepo,
      mockAuditService
    );
  });

  describe('createRequirement', () => {
    it('should create requirement with calculated totals', async () => {
      const data = {
        supplier: 'Test Supplier',
        items: [
          { productId: 'p1', name: 'P1', quantity: 2, unitCost: 50 },
          { productId: 'p2', name: 'P2', quantity: 1, unitCost: 100 },
        ],
      };
      mockRequirementRepo.findByCode.mockResolvedValue(null);
      mockRequirementRepo.create.mockResolvedValue({ id: 'r1', code: 'REQ-01', totalUSD: 200 });

      const result = await requirementService.createRequirement(data, 'u1', '127.0.0.1');

      expect(result.id).toBe('r1');
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'REQUIREMENT',
        action: 'CREATE',
        ipAddress: '127.0.0.1'
      }));
      expect(mockRequirementRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        subtotalUSD: 200,
        totalUSD: 200,
        supplier: 'Test Supplier',
      }));
    });
  });

  describe('getRequirementById', () => {
    it('should return requirement if found', async () => {
      mockRequirementRepo.findById.mockResolvedValue({ id: 'r1' });
      const result = await requirementService.getRequirementById('r1');
      expect(result.id).toBe('r1');
    });

    it('should throw NotFoundError if not found', async () => {
      mockRequirementRepo.findById.mockResolvedValue(null);
      await expect(requirementService.getRequirementById('r1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateRequirementStatus', () => {
    it('should update status and handle stock on RECEIVED', async () => {
      const mockRequirement = {
        id: 'r1',
        code: 'REQ-01',
        status: 'PENDING',
        items: [
          { productId: 'p1', quantity: 10, batchNumber: 'B1', expirationDate: new Date() }
        ]
      };
      mockRequirementRepo.findById.mockResolvedValue(mockRequirement);
      mockRequirementRepo.update.mockResolvedValue({ ...mockRequirement, status: 'RECEIVED' });
      mockProductRepo.findById.mockResolvedValue({ id: 'p1', stock: 5 });

      const result = await requirementService.updateRequirementStatus('r1', 'RECEIVED', 'u1', '127.0.0.1');

      expect(result.status).toBe('RECEIVED');
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'REQUIREMENT',
        action: 'UPDATE_STATUS',
        ipAddress: '127.0.0.1'
      }));
      expect(mockProductRepo.update).toHaveBeenCalledWith('p1', { stock: 15, inStock: true });
      expect(mockBatchRepo.create).toHaveBeenCalled();
      expect(mockLogRepo.create).toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid status', async () => {
      mockRequirementRepo.findById.mockResolvedValue({ id: 'r1' });
      await expect(requirementService.updateRequirementStatus('r1', 'INVALID')).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteRequirement', () => {
    it('should delete if status is PENDING', async () => {
      mockRequirementRepo.findById.mockResolvedValue({ id: 'r1', status: 'PENDING' });
      const result = await requirementService.deleteRequirement('r1');
      expect(result.success).toBe(true);
      expect(mockRequirementRepo.delete).toHaveBeenCalledWith('r1');
    });

    it('should throw ValidationError if status is not PENDING', async () => {
      mockRequirementRepo.findById.mockResolvedValue({ id: 'r1', status: 'APPROVED' });
      await expect(requirementService.deleteRequirement('r1')).rejects.toThrow(ValidationError);
    });
  });
});
