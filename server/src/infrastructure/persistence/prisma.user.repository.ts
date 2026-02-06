import { prisma } from './prisma.client.js'
import { User, UserRepository } from '../../domain/repositories/user.repository.js'

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } })
    return user as User | null
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } })
    return user as User | null
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { username } })
    return user as User | null
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { googleId } })
    return user as User | null
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    const user = await prisma.user.findFirst({ where: { verificationToken: token } })
    return user as User | null
  }

  async findByResetToken(token: string): Promise<User | null> {
    const user = await prisma.user.findFirst({ where: { resetPasswordToken: token } })
    return user as User | null
  }

  async findFirst(where: any): Promise<User | null> {
    const user = await prisma.user.findFirst({ where })
    return user as User | null
  }

  async create(data: any): Promise<User> {
    const user = await prisma.user.create({ data })
    return user as User
  }

  async update(id: string, data: any): Promise<User> {
    const user = await prisma.user.update({ where: { id }, data })
    return user as User
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } })
  }

  async count(where: any): Promise<number> {
    return prisma.user.count({ where })
  }

  async findAll(options: any): Promise<User[]> {
    const users = await prisma.user.findMany(options)
    return users as User[]
  }
}
