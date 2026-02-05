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

  // 4. Asegurar configuraciones base
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
