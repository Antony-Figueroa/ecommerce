import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma.js'
import { authenticate } from '../../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', async (_req: Request, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalRevenue,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      prisma.sale.count(),
      prisma.sale.count({ where: { status: 'PENDING' } }),
      prisma.sale.count({ where: { status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } } }),
      prisma.sale.aggregate({
        _sum: { totalUSD: true },
        where: { status: { not: 'CANCELLED' } },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          stock: { lt: 10 },
        },
      }),
      prisma.sale.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          saleNumber: true,
          customerName: true,
          totalUSD: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

    res.json({
      totalOrders,
      pendingOrders,
      confirmedOrders,
      totalRevenue: Number(totalRevenue._sum.totalUSD || 0),
      totalCustomers,
      totalProducts,
      lowStockProducts,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.saleNumber,
        customerName: order.customerName || 'Cliente',
        total: Number(order.totalUSD),
        status: order.status,
        createdAt: order.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

export default router
