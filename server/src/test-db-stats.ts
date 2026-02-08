import dotenv from 'dotenv'
dotenv.config()
import { prisma } from './infrastructure/persistence/prisma.client.js'

async function testStats() {
  try {
    console.log('--- Testing Prisma Queries for Dashboard ---')
    
    const totalOrders = await prisma.sale.count()
    console.log('Total Orders:', totalOrders)
    
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } })
    console.log('Total Customers:', totalCustomers)
    
    const totalProducts = await prisma.product.count({ where: { isActive: true } })
    console.log('Total Products:', totalProducts)
    
    const recentOrders = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
    console.log('Recent Orders:', JSON.stringify(recentOrders, null, 2))
    
    const completedSales = await prisma.sale.findMany({
      where: { status: 'COMPLETED' }
    })
    const totalRevenue = completedSales.reduce((sum, sale) => sum + Number(sale.totalUSD || 0), 0)
    console.log('Total Revenue (COMPLETED):', totalRevenue)
    
    console.log('--- Test Finished ---')
  } catch (error) {
    console.error('Test Failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStats()
