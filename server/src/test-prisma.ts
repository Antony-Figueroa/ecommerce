import { PrismaClient, Cart } from '@prisma/client'
const prisma = new PrismaClient()
const cart: Cart | null = null;
console.log(prisma.cart, cart)
