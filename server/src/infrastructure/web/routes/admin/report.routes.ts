import { Router, Request, Response } from 'express'
import { bcvService, saleService, dashboardService, inventoryService, requirementService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/profitability', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const report = await dashboardService.getProfitabilityReport(startDate, endDate)
    res.json(report)
  } catch (error) {
    console.error('Error generating profitability report:', error)
    res.status(500).json({ error: 'Error al generar reporte de rentabilidad' })
  }
})

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const bcvRate = await bcvService.getCurrentRate()

    const salesSummary = await saleService.getSalesSummary({
      startDate,
      endDate,
    })

    const items = await dashboardService.getSalesReport(startDate, endDate)
    const totalItems = (items || []).reduce((sum: number, sale: any) => {
      return sum + (sale.items || []).reduce((itemSum: number, item: any) => itemSum + (Number(item.quantity) || 0), 0)
    }, 0)

    const avgProfitMargin = (salesSummary?.summaryUSD?.total || 0) > 0
      ? ((salesSummary?.profitUSD || 0) / salesSummary.summaryUSD.total) * 100
      : 0

    res.json({
      reportDate: new Date().toISOString(),
      period: { startDate, endDate },
      bcvRate,
      items,
      summary: {
        totalSales: salesSummary?.totalSales || 0,
        completedSales: salesSummary?.completedSales || 0,
        pendingSales: salesSummary?.pendingSales || 0,
        totalItems,
        financials: {
          subtotalUSD: Math.round((salesSummary?.summaryUSD?.subtotal || 0) * 100) / 100,
          shippingUSD: Math.round((salesSummary?.summaryUSD?.shipping || 0) * 100) / 100,
          totalUSD: Math.round((salesSummary?.summaryUSD?.total || 0) * 100) / 100,
          totalBS: Math.round((salesSummary?.summaryBS?.total || 0) * 100) / 100,
        },
        profit: {
          USD: Math.round((salesSummary?.profitUSD || 0) * 100) / 100,
          BS: Math.round((salesSummary?.profitBS || 0) * 100) / 100,
          marginPercent: Math.round(avgProfitMargin * 100) / 100,
        },
      },
    })
  } catch (error: any) {
    console.error('Error generating sales report:', error)
    res.status(500).json({ 
      error: 'Error al generar reporte de ventas',
      details: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    })
  }
})

router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const report = await inventoryService.getInventoryReport()
    const bcvRate = await bcvService.getCurrentRate()

    const items = report.products.map((product: any) => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: '',
      stock: product.stock,
      minStock: product.minStock,
      status: product.stock === 0 ? 'AGOTADO' : product.stock <= product.minStock ? 'BAJO STOCK' : 'NORMAL',
      purchasePriceUSD: product.purchasePrice,
      shippingCostUSD: product.shippingCost,
      totalCostUSD: product.totalCost,
      salePriceUSD: product.price,
      salePriceBS: Math.round(product.price * bcvRate * 100) / 100,
      potentialProfitUSD: product.totalValue - product.totalCost,
      profitMarginPercent: product.totalCost > 0
        ? Math.round(((product.totalValue - product.totalCost) / product.totalCost) * 10000) / 100
        : 0,
    }))

    res.json({
      reportDate: new Date().toISOString(),
      bcvRate,
      items,
      summary: {
        totalProducts: report.totalProducts,
        totalItems: report.totalItems,
        totalCostUSD: Math.round(report.totalCostUSD * 100) / 100,
        totalValueUSD: Math.round(report.totalValueUSD * 100) / 100,
        potentialProfitUSD: Math.round(report.potentialProfit * 100) / 100,
        totalValueBS: Math.round(report.totalValueUSD * bcvRate * 100) / 100,
        lowStockCount: report.lowStockCount,
        outOfStockCount: report.outOfStockCount,
      },
      alerts: {
        lowStock: report.alerts.lowStock.map((p: any) => ({ id: p.id, name: p.name, stock: p.stock, minStock: p.minStock })),
        outOfStock: report.alerts.outOfStock.map((p: any) => ({ id: p.id, name: p.name })),
      },
    })
  } catch (error) {
    console.error('Error generating inventory report:', error)
    res.status(500).json({ error: 'Error al generar reporte de inventario' })
  }
})

router.get('/requirements', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined
    const report = await dashboardService.getRequirementsReport(status)

    res.json({
      reportDate: new Date().toISOString(),
      ...report
    })
  } catch (error) {
    console.error('Error generating requirements report:', error)
    res.status(500).json({ error: 'Error al generar reporte de requerimientos' })
  }
})

router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const report = await dashboardService.getAnalyticsReport(startDate, endDate)
    res.json(report)
  } catch (error) {
    console.error('Error generating analytics report:', error)
    res.status(500).json({ error: 'Error al generar reporte de analíticas' })
  }
})

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [salesSummary, inventoryReport, requirementsSummary, bcvRate] = await Promise.all([
      saleService.getSalesSummary(),
      inventoryService.getInventoryReport(),
      requirementService.getRequirementsSummary(),
      bcvService.getCurrentRate(),
    ])

    const recentSales = await saleService.getRecentSales(5)

    res.json({
      updatedAt: new Date().toISOString(),
      bcvRate,
      sales: {
        today: salesSummary.totalSales,
        revenueUSD: salesSummary.summaryUSD.total,
        revenueBS: salesSummary.summaryBS.total,
        profitUSD: salesSummary.profitUSD,
        profitBS: salesSummary.profitBS,
      },
      inventory: {
        totalProducts: inventoryReport.totalProducts,
        totalValueUSD: inventoryReport.totalValueUSD,
        potentialProfit: inventoryReport.potentialProfit,
        lowStock: inventoryReport.lowStockCount,
        outOfStock: inventoryReport.outOfStockCount,
      },
      requirements: {
        pending: requirementsSummary.counts.pending,
        totalInvested: requirementsSummary.totalInvestedUSD,
      },
      recentSales: recentSales.map((s: any) => ({
        id: s.id,
        saleNumber: s.saleNumber,
        customerName: s.customerName,
        totalUSD: Number(s.totalUSD),
        totalBS: Number(s.totalBS),
        status: s.status,
        date: s.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error generating dashboard:', error)
    res.status(500).json({ error: 'Error al generar dashboard' })
  }
})

export default router

