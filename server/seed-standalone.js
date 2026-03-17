const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seed() {
  const count = await prisma.category.count()
  if (count > 0) {
    console.log('Database already has data, skipping seed')
    await prisma.$disconnect()
    return
  }

  console.log('Seeding database...')

  const categories = [
    { name: 'Vitaminas y Suplementos', slug: 'vitaminas-suplementos', description: 'Vitaminas y suplementos' },
    { name: 'Cuidado de la Piel', slug: 'cuidado-piel', description: 'Productos para la piel' },
    { name: 'Deportes y Fitness', slug: 'deportes-fitness', description: 'Para deportistas' },
  ]

  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }
  console.log(`✓ ${categories.length} categories`)

  const brands = [
    { name: 'Nature Made' },
    { name: 'Centrum' },
  ]

  for (const brand of brands) {
    await prisma.brand.create({ data: brand })
  }
  console.log(`✓ ${brands.length} brands`)

  const cat1 = await prisma.category.findFirst({ where: { slug: 'vitaminas-suplementos' } })
  const brand1 = await prisma.brand.findFirst({ where: { name: 'Nature Made' } })

  await prisma.product.create({
    data: {
      name: 'Vitamina C 1000mg',
      sku: 'VITC-001',
      slug: 'vitamina-c-1000mg',
      description: 'Vitamina C para el sistema inmune',
      price: 15.99,
      purchasePrice: 10,
      brand: 'Nature Made',
      format: '60 capsulas',
      stock: 50,
      isFeatured: true,
      categories: { connect: [{ id: cat1.id }] },
      brandRelation: { connect: { id: brand1.id } }
    }
  })
  console.log('✓ Products')

  await prisma.bCVRate.create({ data: { rate: 42.50 } })
  console.log('✓ BCV Rate')

  await prisma.setting.create({ data: { key: 'shop_name', value: "Ana's Supplements", label: 'Nombre' } })
  console.log('✓ Settings')

  console.log('Seed completed!')
  await prisma.$disconnect()
}

seed().catch(console.error)
