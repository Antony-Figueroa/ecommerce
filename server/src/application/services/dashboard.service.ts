import { SaleRepository, RequirementRepository } from '../../domain/repositories/business.repository.js'
import { ProductRepository } from '../../domain/repositories/product.repository.js'
import { UserRepository } from '../../domain/repositories/user.repository.js'
import { BCVRepository } from '../../domain/repositories/settings.repository.js'

export class DashboardService {
  constructor(
    private saleRepo: SaleRepository,
    private productRepo: ProductRepository,
    private userRepo: UserRepository,
    private bcvRepo: BCVRepository,
    private requirementRepo: RequirementRepository
  ) {}

  async getAdminStats(startDate?: string, endDate?: string) {
    try {
      const start = startDate ? new Date(startDate) : undefined
      const end = endDate ? new Date(endDate) : undefined
      const where: any = {}
      if (start || end) {
        where.createdAt = {}
        if (start) where.createdAt.gte = start
        if (end) where.createdAt.lte = end
      }

      const [
        totalOrders,
        pendingOrders,
        confirmedOrders,
        salesData,
        totalCustomers,
        totalProducts,
        lowStockCount,
        recentOrders,
        allSalesForChart,
      ] = await Promise.all([
        this.saleRepo.count(where).catch(e => { console.error('Error in totalOrders:', e); return 0; }),
        this.saleRepo.count({ ...where, status: 'PENDING' }).catch(e => { console.error('Error in pendingOrders:', e); return 0; }),
        this.saleRepo.count({ ...where, status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'] } }).catch(e => { console.error('Error in confirmedOrders:', e); return 0; }),
        this.saleRepo.getSummary({ startDate, endDate }).catch(e => { console.error('Error in salesData:', e); return []; }),
        this.userRepo.count({ role: 'CUSTOMER' }).catch(e => { console.error('Error in totalCustomers:', e); return 0; }),
        this.productRepo.count({ isActive: true }).catch(e => { console.error('Error in totalProducts:', e); return 0; }),
        this.productRepo.count({ isActive: true, stock: { lt: 10 } }).catch(e => { console.error('Error in lowStockCount:', e); return 0; }),
        this.saleRepo.findAll({
          where,
          take: 10,
          orderBy: { createdAt: 'desc' },
        }).catch(e => { console.error('Error in recentOrders:', e); return []; }),
        this.saleRepo.findAll({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
        }).catch(e => { console.error('Error in allSalesForChart:', e); return []; })
      ])

      // Process chart data (last 7 days)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const dailyDataMap = new Map(last7Days.map(date => [date, { sales: 0, revenue: 0 }]))
      
      allSalesForChart.forEach((sale: any) => {
        const date = new Date(sale.createdAt).toISOString().split('T')[0]
        if (dailyDataMap.has(date)) {
          const current = dailyDataMap.get(date)!
          current.sales += 1
          if (sale.status === 'COMPLETED') {
            current.revenue += Number(sale.totalUSD || 0)
          }
        }
      })

      const chartData = Array.from(dailyDataMap.entries()).map(([date, data]) => {
        const dayName = new Date(date).toLocaleDateString('es-ES', { weekday: 'short' })
        return {
          name: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          sales: data.sales,
          revenue: Math.round(data.revenue * 100) / 100
        }
      })

      // Total Revenue (only from COMPLETED sales)
      const totalRevenue = allSalesForChart
        .filter((s: any) => s.status === 'COMPLETED')
        .reduce((sum: number, s: any) => sum + Number(s.totalUSD || 0), 0)

      return {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        lowStockProducts: lowStockCount,
        chartData,
        recentOrders: recentOrders.map((order: any) => ({
          id: order.id,
          orderNumber: order.saleNumber,
          customerName: order.customerName || 'Cliente',
          total: Number(order.totalUSD || 0),
          status: order.status,
          isPaid: order.isPaid,
          createdAt: order.createdAt,
        })),
      }
    } catch (error) {
      console.error('Error in getAdminStats service:', error)
      throw error
    }
  }

  async getProfitabilityReport(startDate?: string, endDate?: string) {
    const where: any = {
      status: 'COMPLETED',
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    }

    const sales = await this.saleRepo.findAll({
      where,
      include: { items: true },
    })

    let totalRevenue = 0
    let totalCost = 0
    let totalProfit = 0

    sales.forEach((sale: any) => {
      totalRevenue += Number(sale.totalUSD || 0)
      totalProfit += Number(sale.profitUSD || 0)
      
      // Cost is Revenue - Profit
      totalCost += (Number(sale.totalUSD || 0) - Number(sale.profitUSD || 0))
    })

    const marginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        marginPercent: Math.round(marginPercent * 100) / 100,
      },
      salesCount: sales.length,
    }
  }

  async getSalesReport(startDate?: string, endDate?: string) {
    const where: any = {
      status: { not: 'CANCELLED' },
      createdAt: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    }

    const sales = await this.saleRepo.findAll({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    return sales.map((sale: any) => ({
      id: sale.id,
      saleNumber: sale.saleNumber,
      date: sale.createdAt,
      customerName: sale.customerName,
      items: (sale.items || []).map((item: any) => ({
        name: item.name,
        quantity: item.quantity || 0,
        unitPriceUSD: Number(item.unitPrice || 0),
        totalUSD: Number(item.total || 0),
        profitUSD: Number(item.totalProfit || 0),
      })),
      subtotalUSD: Number(sale.subtotalUSD || 0),
      shippingCostUSD: Number(sale.shippingCostUSD || 0),
      totalUSD: Number(sale.totalUSD || 0),
      bcvRate: Number(sale.bcvRate || 0),
      totalBS: Number(sale.totalBS || 0),
      profitUSD: Number(sale.profitUSD || 0),
      profitBS: Number(sale.profitBS || 0),
    }))
  }

  async getAnalyticsReport(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    const sales = await this.saleRepo.findAll({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: { 
        items: { 
          include: { 
            product: { 
              include: { 
                categories: true 
              } 
            } 
          } 
        }, 
        user: true 
      },
    })

    // 1. Monthly Stats (grouped by month-year)
    const monthlyStatsMap = new Map()
    sales.forEach((sale: any) => {
      const date = new Date(sale.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleString('es-ES', { month: 'short' })
      
      const existing = monthlyStatsMap.get(key) || { month: monthName, revenue: 0, orders: 0 }
      existing.revenue += Number(sale.totalUSD || 0)
      existing.orders += 1
      monthlyStatsMap.set(key, existing)
    })

    const monthlyStats = Array.from(monthlyStatsMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, data]) => ({
        ...data,
        revenue: Math.round(data.revenue * 100) / 100
      }))

    // 2. Top Products and Category Stats
    const productStatsMap = new Map()
    const categoryStatsMap = new Map()
    let totalItemsRevenue = 0

    sales.forEach((sale: any) => {
      (sale.items || []).forEach((item: any) => {
        const revenue = Number(item.total || 0)
        totalItemsRevenue += revenue

        // Product Stats
        const existingProduct = productStatsMap.get(item.productId) || { name: item.name, sales: 0, revenue: 0 }
        existingProduct.sales += item.quantity
        existingProduct.revenue += revenue
        productStatsMap.set(item.productId, existingProduct)

        // Category Stats
        if (item.product && item.product.categories && item.product.categories.length > 0) {
          item.product.categories.forEach((category: any) => {
            const categoryName = category.name
            const existingCategory = categoryStatsMap.get(categoryName) || { name: categoryName, revenue: 0 }
            existingCategory.revenue += revenue
            categoryStatsMap.set(categoryName, existingCategory)
          })
        }
      })
    })

    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10)
      .map(p => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100
      }))

    const categoryStats = Array.from(categoryStatsMap.values())
      .map(c => ({
        name: c.name,
        percentage: totalItemsRevenue > 0 ? Math.round((c.revenue / totalItemsRevenue) * 100) : 0
      }))
      .sort((a, b) => b.percentage - a.percentage)

    return {
      period: { startDate: start, endDate: end },
      monthlyStats,
      topProducts,
      categoryStats
    }
  }

  async getRequirementsReport(status?: string) {
    const requirements = await this.requirementRepo.findAll({
      where: {
        status: status || undefined,
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    const items = requirements.map((req: any) => ({
      id: req.id,
      code: req.code,
      supplier: req.supplier,
      status: req.status,
      date: req.createdAt,
      notes: req.notes,
      items: (req.items || []).map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitCostUSD: Number(item.unitCost),
        totalUSD: Number(item.total),
      })),
      subtotalUSD: Number(req.subtotalUSD),
      totalUSD: Number(req.totalUSD),
    }))

    const summary = await this.requirementRepo.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalUSD: true },
    })

    const totals = summary.reduce((acc: any, s: any) => ({
      count: acc.count + s._count.id,
      totalUSD: acc.totalUSD + Number(s._sum.totalUSD || 0),
    }), { count: 0, totalUSD: 0 })

    return {
      items,
      summary: {
        total: totals.count,
        totalInvestedUSD: Math.round(totals.totalUSD * 100) / 100,
        byStatus: summary.map((s: any) => ({
          status: s.status,
          count: s._count.id,
          totalUSD: Math.round(Number(s._sum.totalUSD || 0) * 100) / 100,
        })),
      },
    }
  }
}
