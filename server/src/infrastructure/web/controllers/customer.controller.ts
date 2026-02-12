import { Request, Response } from 'express'
import { userService, saleRepo } from '../../../shared/container.js'
import { NotFoundError } from '../../../shared/errors/app.errors.js'

export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 50
    const search = req.query.search as string | undefined
    const role = req.query.role as string | undefined
    
    // El ID del usuario que realiza la consulta (admin)
    const adminId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')

    const result = await userService.getCustomers(
      { page, limit, search, role },
      adminId,
      ipAddress,
      userAgent
    )

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' })
  }
}

export const getCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const adminId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')

    const customer = await userService.getCustomerById(
      id,
      adminId,
      ipAddress,
      userAgent
    )

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
    const data = req.body
    const adminId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')

    const customer = await userService.updateCustomer(
      id,
      data,
      adminId,
      ipAddress,
      userAgent
    )

    res.json({ customer })
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' })
  }
}

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string
    const adminId = (req as any).user?.id
    const ipAddress = req.ip
    const userAgent = req.get('User-Agent')

    await userService.deleteCustomer(
      id,
      adminId,
      ipAddress,
      userAgent
    )

    res.json({ message: 'Cliente desactivado correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente' })
  }
}

