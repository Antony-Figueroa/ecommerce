import Database from 'better-sqlite3'
import { PrismaClient } from '../generated/client/index.js'

const sqlite = new Database('backups/db_backup_2026-03-07_20-51-07.db')
const prisma = new PrismaClient()

async function migrate() {
  console.log('🔄 Migrando datos de SQLite a PostgreSQL...\n')

  // Migrate Categories
  console.log('📂 Migrando categorías...')
  const categories = sqlite.prepare('SELECT * FROM Category').all()
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, description: cat.description, imageUrl: cat.imageUrl, isActive: cat.isActive === 1 },
      create: { id: cat.id, name: cat.name, description: cat.description, imageUrl: cat.imageUrl, isActive: cat.isActive === 1 }
    })
  }
  console.log(`   ✓ ${categories.length} categorías`)

  // Migrate Brands
  console.log('📂 Migrando marcas...')
  const brands = sqlite.prepare('SELECT * FROM Brand').all()
  for (const brand of brands) {
    await prisma.brand.upsert({
      where: { id: brand.id },
      update: { name: brand.name, logoUrl: brand.logoUrl, isActive: brand.isActive === 1 },
      create: { id: brand.id, name: brand.name, logoUrl: brand.logoUrl, isActive: brand.isActive === 1 }
    })
  }
  console.log(`   ✓ ${brands.length} marcas`)

  // Migrate Products
  console.log('📂 Migrando productos...')
  const products = sqlite.prepare('SELECT * FROM Product').all()
  for (const prod of products) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {
        name: prod.name,
        description: prod.description,
        code: prod.code,
        barcode: prod.barcode,
        price: prod.price,
        cost: prod.cost,
        iva: prod.iva,
        stock: prod.stock,
        minStock: prod.minStock,
        maxStock: prod.maxStock,
        isActive: prod.isActive === 1,
        isFeatured: prod.isFeatured === 1,
        categoryId: prod.categoryId,
        brandId: prod.brandId,
        imageUrl: prod.imageUrl
      },
      create: {
        id: prod.id,
        name: prod.name,
        description: prod.description,
        code: prod.code,
        barcode: prod.barcode,
        price: prod.price,
        cost: prod.cost,
        iva: prod.iva,
        stock: prod.stock,
        minStock: prod.minStock,
        maxStock: prod.maxStock,
        isActive: prod.isActive === 1,
        isFeatured: prod.isFeatured === 1,
        categoryId: prod.categoryId,
        brandId: prod.brandId,
        imageUrl: prod.imageUrl
      }
    })
  }
  console.log(`   ✓ ${products.length} productos`)

  // Migrate Users
  console.log('📂 Migrando usuarios...')
  const users = sqlite.prepare('SELECT * FROM User').all()
  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive === 1
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password: user.password,
        isActive: user.isActive === 1
      }
    })
  }
  console.log(`   ✓ ${users.length} usuarios`)

  // Migrate BCV Rate
  console.log('📂 Migrando tasa BCV...')
  const bcv = sqlite.prepare('SELECT * FROM BCVRate ORDER BY createdAt DESC LIMIT 1').get()
  if (bcv) {
    await prisma.bCVRate.create({
      data: { rate: bcv.rate, createdAt: new Date(bcv.createdAt) }
    })
    console.log(`   ✓ Tasa BCV: ${bcv.rate}`)
  }

  // Migrate Settings
  console.log('📂 Migrando configuraciones...')
  const settings = sqlite.prepare('SELECT * FROM Setting').all()
  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value }
    })
  }
  console.log(`   ✓ ${settings.length} configuraciones`)

  // Migrate Providers
  console.log('📂 Migrando proveedores...')
  const providers = sqlite.prepare('SELECT * FROM Provider').all()
  for (const prov of providers) {
    await prisma.provider.upsert({
      where: { id: prov.id },
      update: { name: prov.name, phone: prov.phone, email: prov.email, address: prov.address, isActive: prov.isActive === 1 },
      create: { id: prov.id, name: prov.name, phone: prov.phone, email: prov.email, address: prov.address, isActive: prov.isActive === 1 }
    })
  }
  console.log(`   ✓ ${providers.length} proveedores`)

  console.log('\n✅ Migración completada!')
  await prisma.$disconnect()
  sqlite.close()
}

migrate().catch(console.error)
