import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma.js'
import { BCVService } from '../../services/bcv.service.js'
import { SaleService } from '../../services/sale.service.js'
import { InventoryService } from '../../services/inventory.service.js'
import { RequirementService } from '../../services/requirement.service.js'
import { authenticate } from '../../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/profitability', async (req: Request, res: Response) => {
  try {
    const bcvRate = await BCVService.getCurrentRate()

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    })

    const items = products.map((product: any) => {
      const purchasePrice = Number(product.purchasePrice)
      const shippingCost = Number(product.shippingCost)
      const salePrice = Number(product.price)

      const totalCostUSD = purchasePrice + shippingCost
      const profitUSD = salePrice - totalCostUSD
      const profitMarginPercent = totalCostUSD > 0 ? (profitUSD / totalCostUSD) * 100 : 0

      const totalCostBS = totalCostUSD * bcvRate
      const salePriceBS = salePrice * bcvRate
      const profitBS = profitUSD * bcvRate

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: product.category.name,
        quantity: product.stock,
        purchasePriceUSD: purchasePrice,
        shippingCostUSD: shippingCost,
        totalCostUSD,
        salePriceUSD: salePrice,
        profitUSD,
        profitMarginPercent: Math.round(profitMarginPercent * 100) / 100,
        bcvRate,
        totalCostBS: Math.round(totalCostBS * 100) / 100,
        salePriceBS: Math.round(salePriceBS * 100) / 100,
        profitBS: Math.round(profitBS * 100) / 100,
      }
    })

    const totalInventoryCostUSD = items.reduce((sum: number, item: any) => sum + item.totalCostUSD * item.quantity, 0)
    const totalInventoryValueUSD = items.reduce((sum: number, item: any) => sum + item.salePriceUSD * item.quantity, 0)
    const totalPotentialProfitUSD = items.reduce((sum: number, item: any) => sum + item.profitUSD * item.quantity, 0)

    const totalInventoryCostBS = totalInventoryCostUSD * bcvRate
    const totalInventoryValueBS = totalInventoryValueUSD * bcvRate
    const totalPotentialProfitBS = totalPotentialProfitUSD * bcvRate

    const lowMarginItems = items.filter((i: any) => i.profitMarginPercent < 30)
    const negativeMarginItems = items.filter((i: any) => i.profitUSD < 0)

    res.json({
      reportDate: new Date().toISOString(),
      bcvRate,
      items,
      summary: {
        totalProducts: items.length,
        totalQuantity: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
        inventoryCostUSD: Math.round(totalInventoryCostUSD * 100) / 100,
        inventoryValueUSD: Math.round(totalInventoryValueUSD * 100) / 100,
        potentialProfitUSD: Math.round(totalPotentialProfitUSD * 100) / 100,
        inventoryCostBS: Math.round(totalInventoryCostBS * 100) / 100,
        inventoryValueBS: Math.round(totalInventoryValueBS * 100) / 100,
        potentialProfitBS: Math.round(totalPotentialProfitBS * 100) / 100,
      },
      alerts: {
        lowMarginCount: lowMarginItems.length,
        negativeMarginCount: negativeMarginItems.length,
        lowMarginItems: lowMarginItems.slice(0, 10),
        negativeMarginItems: negativeMarginItems.slice(0, 10),
      },
    })
  } catch (error) {
    console.error('Error generating profitability report:', error)
    res.status(500).json({ error: 'Error al generar reporte de rentabilidad' })
  }
})

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate as string | undefined
    const endDate = req.query.endDate as string | undefined
    const bcvRate = await BCVService.getCurrentRate()

    const salesSummary = await SaleService.getSalesSummary({
      startDate,
      endDate,
    })

    const sales = await prisma.sale.findMany({
      where: {
        status: { not: 'CANCELLED' },
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })

    const items = sales.map((sale: any) => ({
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

    const totalItems = items.reduce((sum: number, sale: any) => {
      return sum + sale.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0)
    }, 0)

    const avgProfitMargin = salesSummary.summaryUSD.total > 0
      ? (salesSummary.profitUSD / salesSummary.summaryUSD.total) * 100
      : 0

    res.json({
      reportDate: new Date().toISOString(),
      period: { startDate, endDate },
      bcvRate,
      items,
      summary: {
        totalSales: salesSummary.totalSales,
        completedSales: salesSummary.completedSales,
        pendingSales: salesSummary.pendingSales,
        totalItems,
        financials: {
          subtotalUSD: Math.round(salesSummary.summaryUSD.subtotal * 100) / 100,
          shippingUSD: Math.round(salesSummary.summaryUSD.shipping * 100) / 100,
          totalUSD: Math.round(salesSummary.summaryUSD.total * 100) / 100,
          totalBS: Math.round(salesSummary.summaryBS.total * 100) / 100,
        },
        profit: {
          USD: Math.round(salesSummary.profitUSD * 100) / 100,
          BS: Math.round(salesSummary.profitBS * 100) / 100,
          marginPercent: Math.round(avgProfitMargin * 100) / 100,
        },
      },
    })
  } catch (error) {
    console.error('Error generating sales report:', error)
    res.status(500).json({ error: 'Error al generar reporte de ventas' })
  }
})

router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const report = await InventoryService.getInventoryReport()
    const bcvRate = await BCVService.getCurrentRate()

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

    const requirements = await prisma.requirement.findMany({
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

    const summary = await prisma.requirement.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { totalUSD: true },
    })

    const totals = summary.reduce((acc: any, s: any) => ({
      count: acc.count + s._count.id,
      totalUSD: acc.totalUSD + Number(s._sum.totalUSD || 0),
    }), { count: 0, totalUSD: 0 })

    res.json({
      reportDate: new Date().toISOString(),
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
    })
  } catch (error) {
    console.error('Error generating requirements report:', error)
    res.status(500).json({ error: 'Error al generar reporte de requerimientos' })
  }
})

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const [salesSummary, inventoryReport, requirementsSummary, bcvRate] = await Promise.all([
      SaleService.getSalesSummary(),
      InventoryService.getInventoryReport(),
      RequirementService.getRequirementsSummary(),
      BCVService.getCurrentRate(),
    ])

    const recentSales = await SaleService.getRecentSales(5)

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
