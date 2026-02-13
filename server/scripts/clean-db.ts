import { PrismaClient } from '../src/generated/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando limpieza de base de datos...')
  
  try {
    // Orden de eliminación para respetar integridad referencial (Sales)
    console.log('Limpiando tablas de pedidos...')
    await prisma.saleItem.deleteMany()
    await prisma.saleAuditLog.deleteMany()
    await prisma.paymentProof.deleteMany()
    await prisma.installment.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.sale.deleteMany()
    console.log('Tablas de pedidos limpiadas.')

    // Orden de eliminación para lotes (Inventory)
    console.log('Limpiando tablas de lotes...')
    await prisma.inventoryBatchItem.deleteMany()
    await prisma.inventoryBatch.deleteMany()
    await prisma.batch.deleteMany()
    await prisma.productPriceHistory.deleteMany()
    console.log('Tablas de lotes limpiadas.')

    // Resetear stock de productos (opcional, pero recomendado si se limpian lotes)
    console.log('Reseteando stock de productos a 0...')
    await prisma.product.updateMany({
      data: {
        stock: 0,
        inStock: false
      }
    })
    console.log('Stock de productos reseteado.')

    console.log('Limpieza completada con éxito.')
  } catch (error) {
    console.error('Error durante la limpieza:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
