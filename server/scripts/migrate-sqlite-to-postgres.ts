import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const sqlite = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
})

const postgres = new PrismaClient()

async function migrate() {
  console.log('🔄 Iniciando migración de SQLite a PostgreSQL...\n')

  try {
    // Migrar usuarios
    console.log('📦 Migrando usuarios...')
    const users = await sqlite.user.findMany()
    for (const user of users) {
      await postgres.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
    console.log(`   ✓ ${users.length} usuarios`)

    // Migrar categorías
    console.log('📦 Migrando categorías...')
    const categories = await sqlite.category.findMany()
    for (const category of categories) {
      await postgres.category.upsert({
        where: { id: category.id },
        update: category,
        create: category
      })
    }
    console.log(`   ✓ ${categories.length} categorías`)

    // Migrar marcas
    console.log('📦 Migrando marcas...')
    const brands = await sqlite.brand.findMany()
    for (const brand of brands) {
      await postgres.brand.upsert({
        where: { id: brand.id },
        update: brand,
        create: brand
      })
    }
    console.log(`   ✓ ${brands.length} marcas`)

    // Migrar proveedores
    console.log('📦 Migrando proveedores...')
    const providers = await sqlite.provider.findMany()
    for (const provider of providers) {
      await postgres.provider.upsert({
        where: { id: provider.id },
        update: provider,
        create: provider
      })
    }
    console.log(`   ✓ ${providers.length} proveedores`)

    // Migrar productos
    console.log('📦 Migrando productos...')
    const products = await sqlite.product.findMany()
    for (const product of products) {
      await postgres.product.upsert({
        where: { id: product.id },
        update: product,
        create: product
      })
    }
    console.log(`   ✓ ${products.length} productos`)

    // Migrar imágenes de productos
    console.log('📦 Migrando imágenes...')
    const images = await sqlite.productImage.findMany()
    for (const image of images) {
      await postgres.productImage.upsert({
        where: { id: image.id },
        update: image,
        create: image
      })
    }
    console.log(`   ✓ ${images.length} imágenes`)

    // Migrar ventas
    console.log('📦 Migrando ventas...')
    const sales = await sqlite.sale.findMany()
    for (const sale of sales) {
      await postgres.sale.upsert({
        where: { id: sale.id },
        update: sale,
        create: sale
      })
    }
    console.log(`   ✓ ${sales.length} ventas`)

    // Migrar items de ventas
    console.log('📦 Migrando items de ventas...')
    const saleItems = await sqlite.saleItem.findMany()
    for (const item of saleItems) {
      await postgres.saleItem.upsert({
        where: { id: item.id },
        update: item,
        create: item
      })
    }
    console.log(`   ✓ ${saleItems.length} items de ventas`)

    // Migrar configuraciones
    console.log('📦 Migrando configuraciones...')
    const settings = await sqlite.setting.findMany()
    for (const setting of settings) {
      await postgres.setting.upsert({
        where: { key: setting.key },
        update: setting,
        create: setting
      })
    }
    console.log(`   ✓ ${settings.length} configuraciones`)

    // Migrar favoritos
    console.log('📦 Migrando favoritos...')
    const favorites = await sqlite.favorite.findMany()
    for (const fav of favorites) {
      await postgres.favorite.upsert({
        where: { id: fav.id },
        update: fav,
        create: fav
      })
    }
    console.log(`   ✓ ${favorites.length} favoritos`)

    // Migrar tasas BCV
    console.log('📦 Migrando tasas BCV...')
    const bcvRates = await sqlite.bCVRate.findMany({ take: 10, orderBy: { createdAt: 'desc' } })
    for (const rate of bcvRates) {
      await postgres.bCVRate.upsert({
        where: { id: rate.id },
        update: rate,
        create: rate
      })
    }
    console.log(`   ✓ ${bcvRates.length} tasas BCV`)

    console.log('\n✅ Migración completada exitosamente!')

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error)
  } finally {
    await sqlite.$disconnect()
    await postgres.$disconnect()
  }
}

migrate()
