import { SettingsService } from '../settings.service.js';
import { ValidationError } from '../../../shared/errors/app.errors.js';

describe('SettingsService', () => {
  let settingsService: SettingsService;
  let mockSettingsRepo: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockSettingsRepo = {
      findAll: jest.fn(),
      findPublic: jest.fn(),
      updateManyWithHistory: jest.fn(),
      getHistory: jest.fn(),
      findHistoryById: jest.fn(),
    };

    mockAuditService = {
      logAction: jest.fn(),
    };

    settingsService = new SettingsService(mockSettingsRepo, mockAuditService);
  });

  describe('getAllSettings', () => {
    it('should group settings by group name', async () => {
      const mockSettings = [
        { key: 'k1', group: 'general' },
        { key: 'k2', group: 'api' },
        { key: 'k3', group: 'general' },
      ];
      mockSettingsRepo.findAll.mockResolvedValue(mockSettings);

      const result = await settingsService.getAllSettings();

      expect(result.general).toHaveLength(2);
      expect(result.api).toHaveLength(1);
    });

    it('should use "general" as default group', async () => {
      const mockSettings = [{ key: 'k1', group: null }];
      mockSettingsRepo.findAll.mockResolvedValue(mockSettings);

      const result = await settingsService.getAllSettings();

      expect(result.general).toHaveLength(1);
    });
  });

  describe('getPublicSettings', () => {
    it('should parse values correctly based on type', async () => {
      const mockSettings = [
        { key: 'num', value: '123', type: 'number' },
        { key: 'bool', value: 'true', type: 'boolean' },
        { key: 'json', value: '{"a":1}', type: 'json' },
        { key: 'str', value: 'hello', type: 'string' },
      ];
      mockSettingsRepo.findPublic.mockResolvedValue(mockSettings);

      const result = await settingsService.getPublicSettings();

      expect(result.num).toBe(123);
      expect(result.bool).toBe(true);
      expect(result.json).toEqual({ a: 1 });
      expect(result.str).toBe('hello');
    });
  });

  describe('updateSettings', () => {
    it('should call updateManyWithHistory and log audit', async () => {
      const updates = [{ key: 'k1', value: 'v1' }];
      await settingsService.updateSettings(updates, 'user1', '127.0.0.1', 'test-agent');
      expect(mockSettingsRepo.updateManyWithHistory).toHaveBeenCalledWith(updates, 'user1');
      expect(mockAuditService.logAction).toHaveBeenCalledWith(expect.objectContaining({
        entityType: 'SETTINGS',
        action: 'UPDATE',
        ipAddress: '127.0.0.1'
      }));
    });

    it('should throw ValidationError if repo fails', async () => {
      mockSettingsRepo.updateManyWithHistory.mockRejectedValue(new Error('Repo error'));
      await expect(settingsService.updateSettings([], 'u1')).rejects.toThrow(ValidationError);
    });
  });

  describe('getHistory', () => {
    it('should throw ValidationError if history not found', async () => {
      mockSettingsRepo.getHistory.mockResolvedValue(null);
      await expect(settingsService.getHistory('k1')).rejects.toThrow(ValidationError);
    });
  });

  describe('revertSetting', () => {
    it('should revert to old value', async () => {
      const historyEntry = {
        setting: { key: 'k1' },
        oldValue: 'old',
        createdAt: new Date(),
      };
      mockSettingsRepo.findHistoryById.mockResolvedValue(historyEntry);

      await settingsService.revertSetting('h1', 'u1');

      expect(mockSettingsRepo.updateManyWithHistory).toHaveBeenCalledWith(
        [expect.objectContaining({ key: 'k1', value: 'old' })],
        'u1'
      );
    });

    it('should throw ValidationError if history entry not found', async () => {
      mockSettingsRepo.findHistoryById.mockResolvedValue(null);
      await expect(settingsService.revertSetting('h1', 'u1')).rejects.toThrow(ValidationError);
    });
  });
});
