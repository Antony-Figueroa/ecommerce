
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Migrando marcas existentes...')
  
  const products = await (prisma.product as any).findMany({
    where: {
      OR: [
        { brandId: null },
        { brandId: '' }
      ]
    },
    select: {
      id: true,
      brand: true
    }
  })

  console.log(`Encontrados ${products.length} productos para procesar.`)

  for (const product of products) {
    if (!product.brand) continue

    const brandName = product.brand.trim()
    
    // Buscar o crear la marca
    const brand = await (prisma as any).brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName }
    })

    // Actualizar el producto con el brandId
    await (prisma.product as any).update({
      where: { id: product.id },
      data: { brandId: brand.id }
    })
    
    console.log(`Producto "${product.id}": Marca "${brandName}" vinculada (ID: ${brand.id})`)
  }

  console.log('Migración completada.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
