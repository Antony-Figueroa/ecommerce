import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../../.env') })

const prisma = new PrismaClient()

/**
 * Obtiene la tasa del dólar actual desde la API oficial de DolarApi (BCV)
 * @returns Tasa actual o valor por defecto si falla
 */
async function fetchCurrentRate(): Promise<number> {
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial')
    if (!response.ok) return 42.50
    const data = await response.json() as { promedio: number }
    return data.promedio || 42.50
  } catch (error) {
    console.error('Error fetching rate during seed:', error)
    return 42.50
  }
}

/**
 * Función principal de siembra de base de datos
 * Limpia datos transaccionales y de catálogo, manteniendo solo lo primordial.
 */
async function main() {
  console.log('🌱 Starting database cleanup and minimal seed...')

  // 1. Limpiar datos transaccionales y de catálogo (en orden de relaciones)
  console.log('🧹 Cleaning up old data...')
  
  // Transacciones y registros
  await prisma.saleItem.deleteMany({})
  await prisma.sale.deleteMany({})
  await prisma.requirementItem.deleteMany({})
  await prisma.requirement.deleteMany({})
  await prisma.inventoryLog.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.favorite.deleteMany({})
  
  // Catálogo
  await prisma.batch.deleteMany({})
  await prisma.productImage.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})
  
  // Tasas antiguas
  await prisma.bCVRate.deleteMany({})

  console.log('✅ Old data cleaned (Users and Settings preserved)')

  // 2. Asegurar usuario administrador
  const adminPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@farmasiaplus.com' },
    update: {},
    create: {
      email: 'admin@farmasiaplus.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
      name: 'Administrador'
    },
  })
  console.log('✅ Admin user verified: admin@farmasiaplus.com')

  // 3. Crear tasa BCV inicial
  const currentRate = await fetchCurrentRate()
  await prisma.bCVRate.create({
    data: {
      rate: currentRate,
      source: 'seed-initial',
      isActive: true,
    },
  })
  console.log(`✅ Initial BCV Rate created: ${currentRate}`)

  // 4. Crear Categorías
  console.log('📦 Creating categories...')
  const categoryData = [
    { name: 'Proteínas', slug: 'proteinas' },
    { name: 'Aminoácidos', slug: 'aminoacidos' },
    { name: 'Vitaminas', slug: 'vitaminas' },
    { name: 'Creatinas', slug: 'creatinas' },
    { name: 'Pre-Entrenos', slug: 'pre-entrenos' }
  ]
  const categories = await Promise.all(
    categoryData.map(cat => 
      prisma.category.create({
        data: {
          name: cat.name,
          slug: cat.slug,
          description: `Suplementos de la categoría ${cat.name}`,
          isActive: true
        }
      })
    )
  )
  console.log(`✅ ${categories.length} categories created`)

  // 5. Crear Productos de Prueba (Nutrex y otros)
  console.log('🛒 Creating test products...')
  const testProducts = [
    {
      name: 'Lipo-6 Black Ultra Concentrate',
      brand: 'Nutrex',
      description: 'Quemador de grasa potente de Nutrex Research.',
      price: 35.00,
      purchasePrice: 20.00,
      stock: 50,
      minStock: 5,
      sku: 'NUT-LIPO-6',
      slug: 'lipo-6-black-ultra-concentrate',
      format: '60 Caps',
      isActive: true,
      currency: 'USD',
      categoryId: categories.find(c => c.name === 'Vitaminas')?.id
    },
    {
      name: 'IsoFit Whey Isolate',
      brand: 'Nutrex',
      description: 'Proteína aislada de suero de alta calidad.',
      price: 65.00,
      purchasePrice: 40.00,
      stock: 20,
      minStock: 3,
      sku: 'NUT-ISOFIT',
      slug: 'isofit-whey-isolate',
      format: '2 lbs',
      isActive: true,
      currency: 'USD',
      categoryId: categories.find(c => c.name === 'Proteínas')?.id
    },
    {
      name: 'Outlift Pre-Workout',
      brand: 'Nutrex',
      description: 'Pre-entrenamiento completo con ingredientes clínicos.',
      price: 45.00,
      purchasePrice: 28.00,
      stock: 15,
      minStock: 2,
      sku: 'NUT-OUTLIFT',
      slug: 'outlift-pre-workout',
      format: '20 Servings',
      isActive: true,
      currency: 'USD',
      categoryId: categories.find(c => c.name === 'Pre-Entrenos')?.id
    },
    {
      name: 'Creatine Drive',
      brand: 'Nutrex',
      description: 'Creatina monohidratada pura para fuerza y volumen.',
      price: 25.00,
      purchasePrice: 15.00,
      stock: 40,
      minStock: 5,
      sku: 'NUT-CREA-DRIVE',
      slug: 'creatine-drive',
      format: '300g',
      isActive: true,
      currency: 'USD',
      categoryId: categories.find(c => c.name === 'Creatinas')?.id
    },
    {
      name: 'Whey Gold Standard',
      brand: 'Optimum Nutrition',
      description: 'La proteína de suero más vendida del mundo.',
      price: 75.00,
      purchasePrice: 50.00,
      stock: 10,
      minStock: 2,
      sku: 'ON-WHEY-GOLD',
      slug: 'whey-gold-standard',
      format: '5 lbs',
      isActive: true,
      currency: 'USD',
      categoryId: categories.find(c => c.name === 'Proteínas')?.id
    }
  ]

  for (const productData of testProducts) {
    const { categoryId, ...data } = productData
    await prisma.product.create({
      data: {
        ...data,
        categories: categoryId ? {
          connect: { id: categoryId }
        } : undefined
      }
    })
  }
  console.log('✅ Test products created')

  // 6. Asegurar configuraciones base
  const defaultSettings = [
    { 
      key: 'store_name', 
      value: "Ana's Supplements", 
      type: 'string', 
      group: 'general', 
      label: 'Nombre de la Tienda',
      description: 'Nombre que se mostrará en el encabezado y correos electrónicos.'
    },
    { 
      key: 'whatsapp_number', 
      value: '+584123456789', 
      type: 'string', 
      group: 'contact', 
      label: 'Número de WhatsApp',
      description: 'Número para el botón de contacto directo.'
    },
    { 
      key: 'currency_main', 
      value: 'USD', 
      type: 'string', 
      group: 'financial', 
      label: 'Moneda Principal',
      description: 'Moneda base para los precios de los productos.'
    },
    { 
      key: 'bcv_auto_update', 
      value: 'true', 
      type: 'boolean', 
      group: 'financial', 
      label: 'Actualización Automática BCV',
      description: 'Si se debe actualizar la tasa automáticamente desde DolarApi.'
    },
    { 
      key: 'chat_ia_visible_admin', 
      value: 'true', 
      type: 'boolean', 
      group: 'ai_chat', 
      label: 'Chat IA visible para Admins',
      description: 'Define si los administradores pueden ver el chat de IA.'
    },
    { 
      key: 'chat_ia_visible_customer', 
      value: 'true', 
      type: 'boolean', 
      group: 'ai_chat', 
      label: 'Chat IA visible para Clientes',
      description: 'Define si los clientes registrados pueden ver el chat de IA.'
    },
    { 
      key: 'chat_ia_visible_guest', 
      value: 'true', 
      type: 'boolean', 
      group: 'ai_chat', 
      label: 'Chat IA visible para Visitantes',
      description: 'Define si los usuarios no registrados pueden ver el chat de IA.'
    }
  ]

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }
  console.log('✅ Base settings verified')

  console.log('\n✨ Database is now clean and ready for real use!')
}

main()
  .catch((e) => {
    console.error('❌ Cleanup failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
