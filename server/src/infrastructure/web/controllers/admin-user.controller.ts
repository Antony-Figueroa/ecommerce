import { Request, Response } from 'express'
import { userRepo } from '../../../shared/container.js'
import bcrypt from 'bcryptjs'
import { ValidationError, NotFoundError } from '../../../shared/errors/app.errors.js'

export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, username } = req.body

    // Validar que el email no exista
    const existingEmail = await userRepo.findByEmail(email)
    if (existingEmail) {
      throw new ValidationError('El email ya está registrado')
    }

    // Validar que el username no exista si se proporciona
    if (username) {
      const existingUsername = await userRepo.findByUsername(username)
      if (existingUsername) {
        throw new ValidationError('El nombre de usuario ya está en uso')
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const admin = await userRepo.create({
      email,
      passwordHash,
      name,
      username: username || null,
      phone: phone || null,
      role: 'ADMIN',
      emailVerified: true, // Admins created by other admins are pre-verified
      isActive: true,
    })

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
    const admins = await userRepo.findAll({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      admins
    })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener administradores' })
  }
}

