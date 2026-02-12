import { UserRepository } from '../../domain/repositories/user.repository.js'
import { AuditService } from './audit.service.js'
import bcrypt from 'bcryptjs'
import { ValidationError, NotFoundError } from '../../shared/errors/app.errors.js'

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private auditService: AuditService
  ) {}

  async createAdmin(data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const { email, password, name, phone, username } = data

    const existingEmail = await this.userRepo.findByEmail(email)
    if (existingEmail) {
      throw new ValidationError('El email ya está registrado')
    }

    if (username) {
      const existingUsername = await this.userRepo.findByUsername(username)
      if (existingUsername) {
        throw new ValidationError('El nombre de usuario ya está en uso')
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const admin = await this.userRepo.create({
      email,
      passwordHash,
      name,
      username: username || null,
      phone: phone || null,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
    })

    await this.auditService.logAction({
      entityType: 'USER',
      entityId: admin.id,
      action: 'CREATE_ADMIN',
      userId,
      details: { email: admin.email, name: admin.name },
      ipAddress,
      userAgent
    })

    return admin
  }

  async updateCustomer(id: string, data: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const { email, name, phone, isActive, role } = data

    const customer = await this.userRepo.update(id, {
      ...(email && { email }),
      ...(name && { name }),
      ...(phone && { phone }),
      ...(isActive !== undefined && { isActive }),
      ...(role && { role }),
    })

    await this.auditService.logAction({
      entityType: 'USER',
      entityId: id,
      action: 'UPDATE_CUSTOMER',
      userId,
      details: { changedFields: Object.keys(data) },
      ipAddress,
      userAgent
    })

    return customer
  }

  async deleteCustomer(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const customer = await this.userRepo.findById(id)
    if (!customer) throw new NotFoundError('Cliente')

    await this.userRepo.update(id, { isActive: false })

    await this.auditService.logAction({
      entityType: 'USER',
      entityId: id,
      action: 'DEACTIVATE_CUSTOMER',
      userId,
      details: { email: customer.email },
      ipAddress,
      userAgent
    })

    return { success: true }
  }

  async getAllAdmins() {
    return this.userRepo.findAll({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getCustomers(options: any, userId?: string, ipAddress?: string, userAgent?: string) {
    const { page = 1, limit = 50, search, role } = options
    const skip = (page - 1) * limit

    const where: any = {}
    
    if (role) {
      where.role = role
    }

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
        { username: { contains: search } }
      ]
    }

    const [customers, total] = await Promise.all([
      this.userRepo.findAll({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { sales: true }
          }
        },
      }),
      this.userRepo.count(where),
    ])

    // Log de auditoría para visualización de lista de clientes (acceso a datos personales)
    await this.auditService.logAction({
      entityType: 'USER',
      action: 'VIEW_CUSTOMERS_LIST',
      userId,
      details: { options },
      ipAddress,
      userAgent
    })

    return {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getCustomerById(id: string, userId?: string, ipAddress?: string, userAgent?: string) {
    const customer = await this.userRepo.findFirst({
      where: { id },
      include: {
        sales: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { items: true }
            }
          }
        }
      },
    })

    if (!customer) {
      throw new NotFoundError('Cliente')
    }

    // Log de auditoría para visualización de detalle de cliente
    await this.auditService.logAction({
      entityType: 'USER',
      entityId: id,
      action: 'VIEW_CUSTOMER_DETAILS',
      userId,
      details: { email: customer.email, name: customer.name },
      ipAddress,
      userAgent
    })

    return customer
  }
}
