
import { PrismaClient } from './src/generated/client/index.js'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      email: 'anadefigueroa2025@gmail.com'
    }
  })
  console.log('User found:', JSON.stringify(user, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
