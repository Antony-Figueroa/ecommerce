import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const saleId = 'dabe3eb2-8b01-447c-88be-f43448f331be'
  const itemId = '8768234c-d87e-4f4c-af68-f9d1daacd1df'

  console.log(`Checking Sale: ${saleId}`)
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true }
  })

  if (!sale) {
    console.log('Sale not found')
  } else {
    console.log('Sale found:', sale.saleNumber)
    const item = sale.items.find(i => i.id === itemId)
    if (!item) {
      console.log('Item not found in this sale')
      console.log('Available items in sale:', sale.items.map(i => i.id))
    } else {
      console.log('Item found:', item.name)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
