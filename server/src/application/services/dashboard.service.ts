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

  async getAdminStats() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        totalOrders,
        pendingOrders,
        confirmedOrders,
        salesData,
        totalCustomers,
        totalProducts,
        lowStockCount,
        recentOrders,
      ] = await Promise.all([
        this.saleRepo.count({}),
        this.saleRepo.count({ status: 'PENDING' }),
        this.saleRepo.count({ status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED'] } }),
        this.saleRepo.getSummary({}), // This returns all sales for now, we can optimize later
        this.userRepo.count({ role: 'CUSTOMER' }),
        this.productRepo.count({ isActive: true }),
        this.productRepo.count({ isActive: true, stock: { lt: 10 } }),
        this.saleRepo.findAll({
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ])

      const totalRevenue = salesData
        .filter((s: any) => s.status !== 'CANCELLED')
        .reduce((sum: number, s: any) => sum + Number(s.totalUSD || 0), 0)

      return {
        totalOrders,
        pendingOrders,
        confirmedOrders,
        totalRevenue,
        totalCustomers,
        totalProducts,
        lowStockProducts: lowStockCount,
        recentOrders: recentOrders.map((order: any) => ({
          id: order.id,
          orderNumber: order.saleNumber,
          customerName: order.customerName || 'Cliente',
          total: Number(order.totalUSD || 0),
          status: order.status,
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
      items: sale.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unitPriceUSD: Number(item.unitPrice),
        totalUSD: Number(item.total),
        profitUSD: Number(item.totalProfit),
      })),
      subtotalUSD: Number(sale.subtotalUSD),
      shippingCostUSD: Number(sale.shippingCostUSD),
      totalUSD: Number(sale.totalUSD),
      bcvRate: Number(sale.bcvRate),
      totalBS: Number(sale.totalBS),
      profitUSD: Number(sale.profitUSD),
      profitBS: Number(sale.profitBS),
    }))
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
      items: req.items.map((item: any) => ({
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
