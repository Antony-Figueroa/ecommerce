
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "file:C:/Users/Server Admin/Desktop/ecommerce/server/prisma/dev.db"
    }
  }
})

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  })
  
  console.log(JSON.stringify(users, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
