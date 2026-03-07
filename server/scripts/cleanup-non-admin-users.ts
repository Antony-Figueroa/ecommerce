import { prisma } from '../src/infrastructure/persistence/prisma.client.js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env') })

const PHARMACEUTICAL_CATEGORIES = [
  'Analgésicos',
  'Antiinflamatorios',
  'Antibióticos',
  'Antialérgicos',
  'Antigripales',
  'Vitaminas y Suplementos',
  'Medicamentos para la Diabetes',
  'Hipertensión y Cardiovascular',
  'Medicamentos Digestivos',
  'Respiratorios',
  'Dermatológicos',
  'Oftálmicos',
  'Neurológicos y Psiquiátricos',
  'Hormonas y Endocrinos',
  'Medicamentos para el Dolor'
]

const PRODUCT_FORMATS = [
  'Tabletas',
  'Cápsulas',
  'Jarabe',
  'Suspensión',
  'Inyecciones',
  'Gotas',
  'Pomada',
  'Crema',
  'Gel',
  'Loción',
  'Comprimidos',
  'Ampollas',
  'Sobres',
  'Pastillas',
  'Spray'
]

async function cleanupDatabase() {
  console.log('🧹 INICIANDO LIMPIEZA DE BASE DE DATOS\n')
  console.log('=' .repeat(50))

  const users = await prisma.user.findMany({ 
    select: { id: true, email: true, role: true } 
  })
  console.log(`\n👥 Usuarios encontrados: ${users.length}`)
  users.forEach(u => console.log(`   - ${u.email} (${u.role})`))

  console.log('\n📦 Eliminando datos del negocio...')

  await prisma.$transaction(async (tx) => {
    console.log('   - Notificaciones y configuraciones...')
    await tx.notificationSetting.deleteMany({})
    await tx.notification.deleteMany({})

    console.log('   - Logs de auditoría...')
    await tx.saleAuditLog.deleteMany({})
    await tx.systemAuditLog.deleteMany({})

    console.log('   - Historial de configuraciones...')
    await tx.settingHistory.deleteMany({})

    console.log('   - Eventos de negocio...')
    await tx.businessEvent.deleteMany({})

    console.log('   - Productos en requerimientos...')
    await tx.requirementItem.deleteMany({})

    console.log('   - Requerimientos...')
    await tx.requirement.deleteMany({})

    console.log('   - Lotes de inventario...')
    await tx.inventoryBatchItem.deleteMany({})
    await tx.inventoryBatch.deleteMany({})

    console.log('   - Historial de precios...')
    await tx.productPriceHistory.deleteMany({})

    console.log('   - Imágenes de productos...')
    await tx.productImage.deleteMany({})

    console.log('   - Productos...')
    await tx.product.deleteMany({})

    console.log('   - Categorías...')
    await tx.category.deleteMany({})

    console.log('   - Marcas...')
    await tx.brand.deleteMany({})

    console.log('   - Proveedores...')
    await tx.provider.deleteMany({})

    console.log('   - Locations de inventario...')
    await tx.inventoryLocation.deleteMany({})
    await tx.inventoryTransfer.deleteMany({})
    await tx.inventoryStock.deleteMany({})

    console.log('   - Items de ventas...')
    await tx.saleItem.deleteMany({})

    console.log('   - Comprobantes de pago...')
    await tx.paymentProof.deleteMany({})

    console.log('   - Cuotas e installments...')
    await tx.installment.deleteMany({})

    console.log('   - Pagos...')
    await tx.payment.deleteMany({})

    console.log('   - Ventas...')
    await tx.sale.deleteMany({})

    console.log('   - Batches...')
    await tx.batch.deleteMany({})

    console.log('   - Favoritos...')
    await tx.favorite.deleteMany({})

    console.log('   - Carritos y items...')
    await tx.cartItem.deleteMany({})
    await tx.cart.deleteMany({})

    console.log('   - Logs de inventario...')
    await tx.inventoryLog.deleteMany({})

    console.log('   - Configuraciones (excepto BCV)...')
    await tx.setting.deleteMany({ where: { key: { not: 'bcv_rate' } } })

    console.log('   - Tasas BCV (mantener solo la última)...')
    const latestBCV = await tx.bCVRate.findFirst({ orderBy: { createdAt: 'desc' } })
    if (latestBCV) {
      await tx.bCVRate.deleteMany({ where: { id: { not: latestBCV.id } } })
    }
  })

  console.log('\n✅ Base de datos limpiada\n')

  const remainingProducts = await prisma.product.count()
  const remainingCategories = await prisma.category.count()
  const remainingSales = await prisma.sale.count()
  
  console.log('📊 Estado después de limpieza:')
  console.log(`   - Productos: ${remainingProducts}`)
  console.log(`   - Categorías: ${remainingCategories}`)
  console.log(`   - Ventas: ${remainingSales}`)
}

async function seedCategories() {
  console.log('\n🌱 AGREGANDO CATEGORÍAS FARMACÉUTICAS\n')
  console.log('=' .repeat(50))

  const existingCategories = await prisma.category.findMany({ select: { name: true } })
  const existingNames = new Set(existingCategories.map(c => c.name.toLowerCase()))

  const categoriesToCreate = PHARMACEUTICAL_CATEGORIES.filter(
    name => !existingNames.has(name.toLowerCase())
  )

  if (categoriesToCreate.length === 0) {
    console.log('✅ Todas las categorías ya existen')
    return
  }

  const categories = await prisma.$transaction(
    categoriesToCreate.map(name => 
      prisma.category.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          isActive: true
        }
      })
    )
  )

  console.log(`✅ ${categories.length} categorías creadas:`)
  categories.forEach(c => console.log(`   - ${c.name}`))

  return categories
}

async function seedFormats() {
  console.log('\n📋 AGREGANDO FORMATOS DE PRODUCTOS\n')
  console.log('=' .repeat(50))

  const existingBrands = await prisma.brand.findMany({ select: { name: true } })
  const existingNames = new Set(existingBrands.map(b => b.name.toLowerCase()))

  const formatsToCreate = PRODUCT_FORMATS.filter(
    name => !existingNames.has(name.toLowerCase())
  )

  if (formatsToCreate.length === 0) {
    console.log('✅ Todos los formatos ya existen')
    return
  }

  const brands = await prisma.$transaction(
    formatsToCreate.map(name => 
      prisma.brand.create({
        data: {
          name
        }
      })
    )
  )

  console.log(`✅ ${brands.length} formatos/marcas creados:`)
  brands.forEach(b => console.log(`   - ${b.name}`))

  return brands
}

async function showSummary() {
  console.log('\n' + '=' .repeat(50))
  console.log('📈 RESUMEN FINAL')
  console.log('=' .repeat(50))

  const users = await prisma.user.count()
  const categories = await prisma.category.count()
  const brands = await prisma.brand.count()
  const products = await prisma.product.count()
  const sales = await prisma.sale.count()
  const providers = await prisma.provider.count()

  console.log(`
  👥 Usuarios: ${users}
  📂 Categorías: ${categories}
  🏷️ Formatos/Marcas: ${brands}
  📦 Productos: ${products}
  💰 Ventas: ${sales}
  🚚 Proveedores: ${providers}
  `)

  const categoriesList = await prisma.category.findMany({ 
    select: { name: true },
    orderBy: { name: 'asc' }
  })
  console.log('Categorías disponibles:')
  categoriesList.forEach(c => console.log(`   - ${c.name}`))

  const formatsList = await prisma.brand.findMany({ 
    select: { name: true },
    orderBy: { name: 'asc' }
  })
  console.log('\nFormatos disponibles:')
  formatsList.forEach(f => console.log(`   - ${f.name}`))
}

async function main() {
  try {
    await cleanupDatabase()
    await seedCategories()
    await seedFormats()
    await showSummary()

    console.log('\n🎉 LIMPIEZA Y SEED COMPLETADOS\n')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error durante la ejecución:', error)
    process.exit(1)
  }
}

main()
