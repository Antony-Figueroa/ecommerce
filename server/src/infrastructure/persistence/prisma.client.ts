import { PrismaClient, Prisma } from '../../generated/client/index.js'

export { Prisma }

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    return 'file:./data/prod.db'
  }
  if (url.startsWith('file:') || url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return url
  }
  return `file:./${url}`
}

if (!process.env.DATABASE_URL?.startsWith('file:') && 
    !process.env.DATABASE_URL?.startsWith('postgresql://') &&
    !process.env.DATABASE_URL?.startsWith('postgres://')) {
  process.env.DATABASE_URL = getPrismaDatabaseUrl()
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
