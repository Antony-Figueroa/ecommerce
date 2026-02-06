import { Request, Response } from 'express'
import { userRepo, saleRepo } from '../../../shared/container.js'
import { NotFoundError } from '../../../shared/errors/app.errors.js'

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const search = req.query.search as string | undefined
    const skip = (page - 1) * limit
    const take = limit

    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [customers, total] = await Promise.all([
      userRepo.findAll({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { sales: true }
          }
        },
      }),
      userRepo.count(where),
    ])

    res.json({
      customers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' })
  }
}

export const getCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    const customer = await userRepo.findFirst({
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
      throw new NotFoundError('Cliente no encontrado')
    }

    res.json({ customer })
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Error al obtener cliente' })
    }
  }
}

export const getCustomerOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.params.customerId as string
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const status = req.query.status as string | undefined
    const skip = (page - 1) * limit
    const take = limit

    const where: any = {
      userId: customerId,
    }

    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      saleRepo.findAll({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, image: true },
              },
            },
          },
        },
      }),
      saleRepo.count(where),
    ])

    res.json({
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos del cliente' })
  }
}

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const { email, name, phone, isActive } = req.body

    const customer = await userRepo.update(id, {
      ...(email && { email }),
      ...(name && { name }),
      ...(phone && { phone }),
      ...(isActive !== undefined && { isActive }),
    })

    res.json({ customer })
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' })
  }
}

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string

    // Borrado lógico: cambiamos isActive a false en lugar de eliminar el registro
    await userRepo.update(id, { isActive: false })

    res.json({ message: 'Cliente desactivado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente' })
  }
}

