import { DashboardService } from '../dashboard.service.js'

describe('DashboardService', () => {
  let dashboardService: DashboardService
  let mockSaleRepo: any
  let mockProductRepo: any
  let mockUserRepo: any
  let mockBcvRepo: any
  let mockRequirementRepo: any

  beforeEach(() => {
    mockSaleRepo = {
      count: jest.fn(),
      getSummary: jest.fn(),
      findAll: jest.fn(),
    }
    mockProductRepo = {
      count: jest.fn(),
    }
    mockUserRepo = {
      count: jest.fn(),
    }
    mockBcvRepo = {
      getLatest: jest.fn(),
    }
    mockRequirementRepo = {
      findAll: jest.fn(),
      groupBy: jest.fn(),
    }

    dashboardService = new DashboardService(
      mockSaleRepo,
      mockProductRepo,
      mockUserRepo,
      mockBcvRepo,
      mockRequirementRepo
    )
  })

  describe('getAdminStats', () => {
    it('should return combined admin statistics correctly', async () => {
      mockSaleRepo.count.mockResolvedValueOnce(100) // totalOrders
      mockSaleRepo.count.mockResolvedValueOnce(10)  // pendingOrders
      mockSaleRepo.count.mockResolvedValueOnce(90)  // confirmedOrders
      mockSaleRepo.getSummary.mockResolvedValue([
        { status: 'COMPLETED', totalUSD: 500 },
        { status: 'CONFIRMED', totalUSD: 300 },
        { status: 'CANCELLED', totalUSD: 100 },
      ])
      mockUserRepo.count.mockResolvedValue(50)
      mockProductRepo.count.mockResolvedValueOnce(200) // totalProducts
      mockProductRepo.count.mockResolvedValueOnce(5)   // lowStockCount
      mockSaleRepo.findAll.mockResolvedValue([
        { id: '1', saleNumber: 'V-001', customerName: 'John', totalUSD: 100, status: 'COMPLETED', createdAt: new Date() }
      ])

      const result = await dashboardService.getAdminStats()

      expect(result.totalOrders).toBe(100)
      expect(result.totalRevenue).toBe(500) // only COMPLETED sales
      expect(result.totalCustomers).toBe(50)
      expect(result.recentOrders).toHaveLength(1)
      expect(result.recentOrders[0].orderNumber).toBe('V-001')
    })

    it('should apply date filters to repository calls', async () => {
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'
      
      mockSaleRepo.count.mockResolvedValue(0)
      mockSaleRepo.getSummary.mockResolvedValue([])
      mockUserRepo.count.mockResolvedValue(0)
      mockProductRepo.count.mockResolvedValue(0)
      mockSaleRepo.findAll.mockResolvedValue([])

      await dashboardService.getAdminStats(startDate, endDate)

      const expectedWhere = {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        }
      }

      expect(mockSaleRepo.count).toHaveBeenCalledWith(expectedWhere)
      expect(mockSaleRepo.getSummary).toHaveBeenCalledWith({ startDate, endDate })
    })
  })

  describe('getAnalyticsReport', () => {
    it('should aggregate data by month and product correctly', async () => {
      const mockSales = [
        {
          createdAt: new Date('2024-01-15'),
          totalUSD: 100,
          items: [
            { productId: 'p1', name: 'Product 1', quantity: 2, total: 40 },
            { productId: 'p2', name: 'Product 2', quantity: 1, total: 60 },
          ]
        },
        {
          createdAt: new Date('2024-02-10'),
          totalUSD: 200,
          items: [
            { productId: 'p1', name: 'Product 1', quantity: 3, total: 60 },
          ]
        }
      ]

      mockSaleRepo.findAll.mockResolvedValue(mockSales)

      const result = await dashboardService.getAnalyticsReport()

      // Check monthly stats
      expect(result.monthlyStats).toHaveLength(2)
      expect(result.monthlyStats[0].revenue).toBe(100)
      expect(result.monthlyStats[1].revenue).toBe(200)

      // Check top products
      expect(result.topProducts).toHaveLength(2)
      // Product 1 total sales: 2 + 3 = 5
      // Product 2 total sales: 1
      expect(result.topProducts[0].name).toBe('Product 1')
      expect(result.topProducts[0].sales).toBe(5)
      expect(result.topProducts[0].revenue).toBe(100)
    })
  })

  describe('getProfitabilityReport', () => {
    it('should calculate profitability metrics correctly', async () => {
      const mockSales = [
        { totalUSD: 100, profitUSD: 30 },
        { totalUSD: 200, profitUSD: 80 },
      ]
      mockSaleRepo.findAll.mockResolvedValue(mockSales)

      const result = await dashboardService.getProfitabilityReport()

      expect(result.summary.totalRevenue).toBe(300)
      expect(result.summary.totalProfit).toBe(110)
      expect(result.summary.totalCost).toBe(190) // 300 - 110
      expect(result.summary.marginPercent).toBe(36.67) // (110 / 300) * 100
    })
  })
})
