import { jest } from '@jest/globals'
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
      getCurrentRate: jest.fn(),
    }
    mockRequirementRepo = {
      count: jest.fn(),
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
    it('should return correct stats summary', async () => {
      mockSaleRepo.count.mockResolvedValueOnce(100) // totalOrders
      mockSaleRepo.count.mockResolvedValueOnce(20)  // pendingOrders
      mockSaleRepo.count.mockResolvedValueOnce(80)  // confirmedOrders
      mockSaleRepo.getSummary.mockResolvedValue([]) // salesData
      mockUserRepo.count.mockResolvedValue(50)      // totalCustomers
      mockProductRepo.count.mockResolvedValueOnce(200) // totalProducts
      mockProductRepo.count.mockResolvedValueOnce(5)   // lowStockCount
      
      const mockRecentOrders = [
        { id: '1', saleNumber: 'V001', customerName: 'John', totalUSD: 100, status: 'COMPLETED', isPaid: true, createdAt: new Date() }
      ]
      mockSaleRepo.findAll.mockResolvedValueOnce(mockRecentOrders) // recentOrders
      mockSaleRepo.findAll.mockResolvedValueOnce(mockRecentOrders) // allSalesForChart

      const stats = await dashboardService.getAdminStats()

      expect(stats.totalOrders).toBe(100)
      expect(stats.pendingOrders).toBe(20)
      expect(stats.confirmedOrders).toBe(80)
      expect(stats.totalCustomers).toBe(50)
      expect(stats.totalProducts).toBe(200)
      expect(stats.lowStockProducts).toBe(5)
      expect(stats.totalRevenue).toBe(100)
      expect(stats.recentOrders).toHaveLength(1)
      expect(stats.recentOrders[0].orderNumber).toBe('V001')
    })

    it('should handle repository errors gracefully', async () => {
      mockSaleRepo.count.mockRejectedValue(new Error('DB Error'))
      mockSaleRepo.getSummary.mockResolvedValue([])
      mockUserRepo.count.mockResolvedValue(0)
      mockProductRepo.count.mockResolvedValue(0)
      mockSaleRepo.findAll.mockResolvedValue([])

      const stats = await dashboardService.getAdminStats()

      expect(stats.totalOrders).toBe(0) // Caught by .catch() in service
      expect(stats.totalRevenue).toBe(0)
    })
  })

  describe('getProfitabilityReport', () => {
    it('should calculate profitability metrics correctly', async () => {
      const mockSales = [
        { totalUSD: 100, profitUSD: 20 },
        { totalUSD: 200, profitUSD: 50 },
      ]
      mockSaleRepo.findAll.mockResolvedValue(mockSales)

      const report = await dashboardService.getProfitabilityReport()

      expect(report.summary.totalRevenue).toBe(300)
      expect(report.summary.totalProfit).toBe(70)
      expect(report.summary.totalCost).toBe(230)
      expect(report.summary.marginPercent).toBeCloseTo(23.33)
      expect(report.salesCount).toBe(2)
    })
  })

  describe('getSalesReport', () => {
    it('should format sales data correctly', async () => {
      const mockSales = [
        {
          id: 's1',
          saleNumber: 'V001',
          createdAt: new Date(),
          customerName: 'John',
          items: [{ name: 'Item 1', quantity: 2, unitPrice: 10, total: 20, totalProfit: 5 }],
          subtotalUSD: 20,
          shippingCostUSD: 5,
          totalUSD: 25,
          bcvRate: 36,
          totalBS: 900,
          profitUSD: 5,
          profitBS: 180
        }
      ]
      mockSaleRepo.findAll.mockResolvedValue(mockSales)

      const report = await dashboardService.getSalesReport()

      expect(report).toHaveLength(1)
      expect(report[0].saleNumber).toBe('V001')
      expect(report[0].items).toHaveLength(1)
      expect(report[0].totalUSD).toBe(25)
    })
  })

  describe('getAnalyticsReport', () => {
    it('should calculate analytics correctly', async () => {
      const mockSales = [
        {
          id: 's1',
          totalUSD: 100,
          createdAt: new Date('2024-01-15'),
          status: 'COMPLETED',
          items: [
            {
              productId: 'p1',
              name: 'Prod 1',
              quantity: 2,
              total: 100,
              product: {
                categories: [{ name: 'Cat 1' }]
              }
            }
          ]
        }
      ]
      mockSaleRepo.findAll.mockResolvedValue(mockSales)

      const report = await dashboardService.getAnalyticsReport('2024-01-01', '2024-01-31')

      expect(report.monthlyStats).toHaveLength(1)
      expect(report.topProducts).toHaveLength(1)
      expect(report.categoryStats).toHaveLength(1)
      expect(report.categoryStats[0].percentage).toBe(100)
    })
  })

  describe('getRequirementsReport', () => {
    it('should format requirements correctly', async () => {
      const mockRequirements = [
        {
          id: 'r1',
          status: 'PENDING',
          createdAt: new Date(),
          items: [{ name: 'Req Item', quantity: 10 }]
        }
      ]
      mockRequirementRepo.findAll.mockResolvedValue(mockRequirements)
      mockRequirementRepo.groupBy.mockResolvedValue([
        { status: 'PENDING', _count: { id: 1 }, _sum: { totalUSD: 100 } }
      ])

      const report = await dashboardService.getRequirementsReport()

      expect(report.items).toHaveLength(1)
      expect(report.items[0].id).toBe('r1')
      expect(report.summary.total).toBe(1)
    })
  })
})
