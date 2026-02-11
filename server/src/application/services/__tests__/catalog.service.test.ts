import { jest } from '@jest/globals';
import { CatalogService } from '../catalog.service.js';

// Mock pdfkit
jest.mock('pdfkit', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => {
    return {
      on: jest.fn(function(this: any, event: string, cb: any) {
        if (event === 'data') {
          cb(Buffer.from('pdf data'));
        }
        if (event === 'end') {
          cb();
        }
        return this;
      }),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      strokeColor: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
  }),
}));

describe('CatalogService', () => {
  let catalogService: CatalogService;
  let mockProductRepo: any;
  let mockEmailService: any;

  beforeEach(() => {
    mockProductRepo = {
      findAll: jest.fn(),
    };
    mockEmailService = {
      sendCatalogEmail: jest.fn(),
    };

    catalogService = new CatalogService(mockProductRepo, mockEmailService);
  });

  describe('generateCatalogPDF', () => {
    it('should generate a PDF buffer from active products', async () => {
      const mockProducts = [
        { name: 'Product 1', brand: 'Brand A', price: 100 },
        { name: 'Product 2', brand: 'Brand B', price: 200 },
      ];
      mockProductRepo.findAll.mockResolvedValue({ products: mockProducts });

      const buffer = await catalogService.generateCatalogPDF();

      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      expect(mockProductRepo.findAll).toHaveBeenCalledWith({ limit: 100, onlyActive: true });
    });
  });

  describe('requestCatalog', () => {
    it('should generate PDF and send email', async () => {
      const mockProducts = [{ name: 'P1', brand: 'B1', price: 50 }];
      mockProductRepo.findAll.mockResolvedValue({ products: mockProducts });
      mockEmailService.sendCatalogEmail.mockResolvedValue(undefined);

      await catalogService.requestCatalog('test@example.com');

      expect(mockEmailService.sendCatalogEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Buffer)
      );
    });
  });
});
