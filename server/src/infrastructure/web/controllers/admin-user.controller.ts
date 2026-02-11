import { Request, Response } from 'express'
import { userService } from '../../../shared/container.js'
import { ValidationError } from '../../../shared/errors/app.errors.js'

export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const admin = await userService.createAdmin(
      req.body, 
      (req as any).user?.id,
      req.ip,
      req.get('User-Agent')
    )

    res.status(201).json({
      success: true,
      message: 'Administrador creado exitosamente',
      user: admin
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('Error al crear administrador:', error)
      res.status(500).json({ error: 'Error al crear administrador' })
    }
  }
}

export const getAdmins = async (req: Request, res: Response): Promise<void> => {
  try {
    const admins = await userService.getAllAdmins()

    res.json({
      success: true,
      admins
    })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener administradores' })
  }
}

