import { PrismaClient } from '../generated/client/index.js'

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
    { name: 'Vitaminas y Suplementos', slug: 'vitaminas-suplementos', description: 'Vitaminas y suplementos para tu salud' },
    { name: 'Cuidado de la Piel', slug: 'cuidado-piel', description: 'Productos para el cuidado de la piel' },
    { name: 'Deportes y Fitness', slug: 'deportes-fitness', description: 'Suplementos para deportistas' },
    { name: 'Salud Digestiva', slug: 'salud-digestiva', description: 'Productos para la salud digestiva' },
    { name: 'Sistema Inmunológico', slug: 'sistema-inmune', description: 'Fortalece tu sistema inmune' },
  ]

  for (const cat of categories) {
    await prisma.category.create({ data: cat })
  }
  console.log(`✓ ${categories.length} categorías`)

  const brands = [
    { name: 'Nature Made' },
    { name: 'Centrum' },
    { name: 'Optimum Nutrition' },
    { name: 'Garden of Life' },
    { name: 'Puritan\'s Pride' },
  ]

  for (const brand of brands) {
    await prisma.brand.create({ data: brand })
  }
  console.log(`✓ ${brands.length} marcas`)

  const cat1 = await prisma.category.findFirst({ where: { slug: 'vitaminas-suplementos' } })
  const brand1 = await prisma.brand.findFirst({ where: { name: 'Nature Made' } })

  await prisma.product.create({
    data: {
      name: 'Vitamina C 1000mg',
      sku: 'VITC-001',
      slug: 'vitamina-c-1000mg',
      description: 'Suplemento de vitamina C para fortalecer el sistema inmune',
      price: 15.99,
      purchasePrice: 10,
      brand: 'Nature Made',
      format: '60 capsulas',
      stock: 50,
      isFeatured: true,
      categories: { connect: [{ id: cat1!.id }] },
      brandRelation: { connect: { id: brand1!.id } }
    }
  })
  console.log('✓ Productos')

  await prisma.bCVRate.create({ data: { rate: 42.50 } })
  console.log('✓ Tasa BCV')

  await prisma.setting.create({ data: { key: 'shop_name', value: 'Ana\'s Supplements', label: 'Nombre de la tienda' } })
  console.log('✓ Configuraciones')

  console.log('Seed completed!')
  await prisma.$disconnect()
}

seed().catch(console.error)
