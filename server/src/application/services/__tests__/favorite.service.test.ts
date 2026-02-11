import { FavoriteService } from '../favorite.service.js';

describe('FavoriteService', () => {
  let favoriteService: FavoriteService;
  let mockFavoriteRepo: any;
  let mockNotificationService: any;

  beforeEach(() => {
    mockFavoriteRepo = {
      findAllByUserId: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findAllByProductId: jest.fn(),
      findProductById: jest.fn(),
      delete: jest.fn(),
    };
    mockNotificationService = {
      createNotification: jest.fn(),
    };

    favoriteService = new FavoriteService(mockFavoriteRepo, mockNotificationService);
  });

  describe('getFavorites', () => {
    it('should return mapped products from favorites', async () => {
      const mockFavorites = [
        { product: { id: 'p1', name: 'Product 1' } },
        { product: null },
        { product: { id: 'p2', name: 'Product 2' } },
      ];
      mockFavoriteRepo.findAllByUserId.mockResolvedValue(mockFavorites);

      const result = await favoriteService.getFavorites('user1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('p1');
      expect(result[1].id).toBe('p2');
    });

    it('should throw error if repository fails', async () => {
      mockFavoriteRepo.findAllByUserId.mockRejectedValue(new Error('Repo error'));
      await expect(favoriteService.getFavorites('user1')).rejects.toThrow('Repo error');
    });
  });

  describe('checkFavorite', () => {
    it('should return true if favorite exists', async () => {
      mockFavoriteRepo.findUnique.mockResolvedValue({ userId: 'u1', productId: 'p1' });
      const result = await favoriteService.checkFavorite('u1', 'p1');
      expect(result).toBe(true);
    });

    it('should return false if favorite does not exist', async () => {
      mockFavoriteRepo.findUnique.mockResolvedValue(null);
      const result = await favoriteService.checkFavorite('u1', 'p1');
      expect(result).toBe(false);
    });
  });

  describe('addFavorite', () => {
    it('should call upsert on repository', async () => {
      mockFavoriteRepo.upsert.mockResolvedValue({ userId: 'u1', productId: 'p1' });
      const result = await favoriteService.addFavorite('u1', 'p1');
      expect(result.productId).toBe('p1');
      expect(mockFavoriteRepo.upsert).toHaveBeenCalledWith('u1', 'p1');
    });
  });

  describe('notifyPriceDrop', () => {
    it('should not notify if price did not drop', async () => {
      await favoriteService.notifyPriceDrop('p1', 100, 100);
      expect(mockFavoriteRepo.findAllByProductId).not.toHaveBeenCalled();
    });

    it('should notify interested users on price drop', async () => {
      const mockUsers = [{ userId: 'u1' }, { userId: 'u2' }];
      const mockProduct = { name: 'Test Product', slug: 'test-product' };
      
      mockFavoriteRepo.findAllByProductId.mockResolvedValue(mockUsers);
      mockFavoriteRepo.findProductById.mockResolvedValue(mockProduct);

      await favoriteService.notifyPriceDrop('p1', 100, 80);

      expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
        type: 'PRICE_DROP',
        userId: 'u1',
        title: '¡Bajada de precio!',
      }));
    });
  });

  describe('removeFavorite', () => {
    it('should call delete on repository', async () => {
      await favoriteService.removeFavorite('u1', 'p1');
      expect(mockFavoriteRepo.delete).toHaveBeenCalledWith('u1', 'p1');
    });
  });
});
