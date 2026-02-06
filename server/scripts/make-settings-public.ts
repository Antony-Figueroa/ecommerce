import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../../.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Making settings public...')
  
  const publicKeys = ['whatsapp_number', 'store_name', 'currency_main']
  
  for (const key of publicKeys) {
    const setting = await prisma.setting.update({
      where: { key },
      data: { isPublic: true }
    })
    console.log(`✅ Setting "${key}" is now public.`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Failed to update settings:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
