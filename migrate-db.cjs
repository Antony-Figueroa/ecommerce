const { PrismaClient } = require('./server/src/generated/client/index.js')
const Database = require('better-sqlite3')
const path = require('path')
const { Pool } = require('pg')

const sqlitePath = path.join(__dirname, 'server/prisma/dev.db')
const pgUrl = process.env.DATABASE_URL

if (!pgUrl) {
  console.error('DATABASE_URL no está configurada')
  process.exit(1)
}

const sqliteDb = Database(sqlitePath)
const pool = new Pool({ connectionString: pgUrl })

function convertRow(row) {
  const newRow = { ...row }
  for (const key of Object.keys(newRow)) {
    const val = newRow[key]
    if (typeof val === 'number' && val > 1000000000000) {
      newRow[key] = new Date(val)
    }
    if (val === 0 || val === 1) {
      newRow[key] = val === 1
    }
  }
  return newRow
}

async function migrate() {
  console.log('🔄 Migrando datos a PostgreSQL...\n')
  
  const tables = [
    { sqlite: 'User', pg: 'User' },
    { sqlite: 'Category', pg: 'Category' },
    { sqlite: 'Product', pg: 'Product' },
    { sqlite: 'Brand', pg: 'Brand' },
    { sqlite: 'Provider', pg: 'Provider' },
    { sqlite: 'BCVRate', pg: 'BCVRate' },
  ]

  for (const t of tables) {
    const rows = sqliteDb.prepare(`SELECT * FROM ${t.sqlite}`).all()
    console.log(`📦 ${t.pg}: ${rows.length} registros`)
    
    if (rows.length === 0) continue

    for (const row of rows) {
      const data = convertRow(row)
      const cols = Object.keys(data)
      const vals = Object.values(data).map(v => {
        if (v instanceof Date) return v.toISOString()
        if (typeof v === 'boolean') return v
        if (typeof v === 'number') return v
        return v
      })
      
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
      const sql = `INSERT INTO "${t.pg}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`
      
      try {
        await pool.query(sql, vals)
      } catch (e) {
        console.log(`   ❌ Error: ${e.message}`)
        break
      }
    }
    console.log(`   ✅ Listo`)
  }

  console.log('\n✅ Migración completada!')
  sqliteDb.close()
  await pool.end()
}

migrate().catch(console.error)
