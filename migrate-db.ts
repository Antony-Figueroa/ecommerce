import { PrismaClient } from './server/src/generated/client/index.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sqlitePath = path.join(__dirname, 'server/prisma/dev.db')
const pgUrl = process.env.DATABASE_URL

if (!pgUrl) {
  console.error('DATABASE_URL no está configurada')
  process.exit(1)
}

// Usar better-sqlite3 localmente
const Database = require('better-sqlite3')
const sqliteDb = Database(sqlitePath)

const pg = new PrismaClient({
  datasources: {
    db: { url: pgUrl }
  }
})

async function migrate() {
  console.log('🔄 Iniciando migración de SQLite a PostgreSQL...')
  
  // Obtener todas las tablas
  const tables = sqliteDb.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `).all() as { name: string }[]

  console.log(`📋 Tablas encontradas: ${tables.map((t: any) => t.name).join(', ')}`)

  for (const table of tables) {
    const tableName = table.name
    console.log(`\n📦 Migrando ${tableName}...`)
    
    try {
      const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all()
      console.log(`   Encontrados ${rows.length} registros`)
      
      if (rows.length === 0) continue

      // Insertar en PostgreSQL
      for (const row of rows) {
        try {
          await (pg as any)[tableName.toLowerCase()].create({
            data: row
          })
        } catch (e: any) {
          if (e.code === 'P2002') {
            // Registro duplicado, continuar
          } else if (e.code === 'P2025') {
            console.log(`   ⚠️ Error en ${tableName}: registro relacionado no encontrado`)
          } else {
            console.log(`   ⚠️ Error: ${e.message}`)
          }
        }
      }
      
      console.log(`   ✅ ${tableName} migrado`)
    } catch (e: any) {
      console.log(`   ❌ Error migrando ${tableName}: ${e.message}`)
    }
  }

  console.log('\n✅ Migración completada')
  sqliteDb.close()
  await pg.$disconnect()
}

migrate().catch(console.error)
