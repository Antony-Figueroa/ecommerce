import { PrismaClient } from '../generated/client/index.js'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Creando datos de prueba...\n')

  // Create categories
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

  // Create brands
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

  // Get category and brand IDs
  const cat1 = await prisma.category.findFirst({ where: { slug: 'vitaminas-suplementos' } })
  const brand1 = await prisma.brand.findFirst({ where: { name: 'Nature Made' } })
  const brand2 = await prisma.brand.findFirst({ where: { name: 'Centrum' } })
  const brand3 = await prisma.brand.findFirst({ where: { name: 'Garden of Life' } })
  const cat2 = await prisma.category.findFirst({ where: { slug: 'salud-digestiva' } })

  // Create sample products
  const products = [
    { 
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
    },
    { 
      name: 'Vitamina D3 5000 IU', 
      sku: 'VITD-002',
      slug: 'vitamina-d3-5000iu',
      description: 'Vitamina D3 para huesos fuertes',
      price: 12.99,
      purchasePrice: 8,
      brand: 'Centrum',
      format: '90 capsulas',
      stock: 75,
      isFeatured: true,
      categories: { connect: [{ id: cat1!.id }] },
      brandRelation: { connect: { id: brand2!.id } }
    },
    { 
      name: 'Omega-3 Fish Oil', 
      sku: 'OMG3-001',
      slug: 'omega-3-fish-oil',
      description: 'Aceite de pescado rico en omega-3',
      price: 24.99,
      purchasePrice: 15,
      brand: 'Garden of Life',
      format: '90 capsulas',
      stock: 30,
      isFeatured: true,
      categories: { connect: [{ id: cat2!.id }] },
      brandRelation: { connect: { id: brand3!.id } }
    },
  ]

  for (const prod of products) {
    await prisma.product.create({ data: prod })
  }
  console.log(`✓ ${products.length} productos`)

  // Create BCV rate
  await prisma.bCVRate.create({ data: { rate: 42.50 } })
  console.log('✓ Tasa BCV: 42.50')

  // Create settings
  await prisma.setting.create({ data: { key: 'shop_name', value: 'Ana\'s Supplements', label: 'Nombre de la tienda' } })
  await prisma.setting.create({ data: { key: 'shop_phone', value: '+58 412-1234567', label: 'Teléfono' } })
  await prisma.setting.create({ data: { key: 'shop_address', value: 'Caracas, Venezuela', label: 'Dirección' } })
  console.log('✓ Configuraciones')

  console.log('\n✅ Seed completado!')
  await prisma.$disconnect()
}

seed().catch(console.error)
