import { Router, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { config } from '../config/index.js'
import { ValidationError } from '../utils/errors.js'
import { validate, registerSchema, loginSchema, googleRegisterSchema } from '../middleware/validation.js'
import { OAuth2Client } from 'google-auth-library'
import { Filter } from 'bad-words'
import crypto from 'crypto'
import { emailService } from '../services/email.service.js'

const router = Router()
// Google OAuth client initialization
const client = new OAuth2Client(config.googleClientId)
const filter = new Filter()

// Palabras ofensivas adicionales en español
filter.addWords('pendejo', 'puto', 'puta', 'mierda', 'carajo', 'culero', 'cabron', 'chingar', 'pajuo', 'mamaguevo')

router.post('/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body
    if (!credential) {
      throw new ValidationError('Credencial de Google requerida')
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    })

    const payload = ticket.getPayload()
    if (!payload) {
      throw new ValidationError('Token de Google inválido')
    }

    const { sub: googleId, email, name, picture: avatarUrl } = payload

    if (!email) {
      throw new ValidationError('El email de Google es requerido')
    }

    // Verificar si el usuario ya existe
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    })

    if (user) {
      console.log(`[Google Auth] Usuario encontrado: ${user.email} (ID: ${user.id})`)
      // Si el usuario existe pero no tiene googleId, se lo vinculamos
      if (!user.googleId) {
        console.log(`[Google Auth] Vinculando cuenta existente con Google ID para: ${user.email}`)
        await prisma.user.update({
          where: { id: user.id },
          data: { googleId, avatarUrl: avatarUrl || user.avatarUrl }
        })
      }

      // Si ya tiene username, iniciamos sesión directamente
      if (user.username) {
        console.log(`[Google Auth] Login exitoso para usuario: ${user.username}`)
        const token = jwt.sign(
          { userId: user.id, email: user.email, role: user.role },
          config.jwtSecret,
          { expiresIn: '7d' }
        )

        return res.json({
          success: true,
          requiresRegistration: false,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
            role: user.role,
            avatarUrl: user.avatarUrl
          },
          token
        })
      }
      console.log(`[Google Auth] Usuario sin username: ${user.email}. Redirigiendo a confirmación.`)
    } else {
      console.log(`[Google Auth] Nuevo usuario de Google: ${email}. Redirigiendo a confirmación.`)
    }

    // Si es nuevo o no tiene username, enviamos datos para completar registro
    res.json({
      success: true,
      requiresRegistration: true,
      googleData: {
        googleId,
        email,
        name,
        avatarUrl
      }
    })
  } catch (error) {
    console.error('Error en Google Auth:', error)
    res.status(400).json({ error: error instanceof Error ? error.message : 'Error en autenticación con Google' })
  }
})

router.post('/google/register', validate(googleRegisterSchema), async (req: Request, res: Response) => {
  try {
    const { googleId, email, name, avatarUrl, username } = req.body
    console.log(`[Google Register] Intentando registrar/actualizar usuario: ${email} con username: ${username}`)

    // Validar profanidad en username
    if (filter.isProfane(username)) {
      console.warn(`[Google Register] Intento de registro con username inapropiado: ${username}`)
      throw new ValidationError('El nombre de usuario contiene palabras inapropiadas')
    }

    // Verificar si el username ya está en uso
    const existingUsername = await prisma.user.findUnique({ where: { username } })
    if (existingUsername) {
      console.warn(`[Google Register] Username ya en uso: ${username}`)
      throw new ValidationError('El nombre de usuario ya está en uso')
    }

    // Verificar si ya existe un usuario con ese email o googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email }
        ]
      }
    })

    if (user) {
      console.log(`[Google Register] Actualizando usuario existente: ${user.email}`)
      // Actualizar usuario existente
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          googleId,
          name: name || user.name,
          avatarUrl: avatarUrl || user.avatarUrl,
          emailVerified: true, // Google accounts are verified
        }
      })
    } else {
      console.log(`[Google Register] Creando nuevo usuario: ${email}`)
      // Crear nuevo usuario
      user = await prisma.user.create({
        data: {
          email,
          name,
          username,
          googleId,
          avatarUrl,
          role: 'CUSTOMER',
          emailVerified: true, // Google accounts are verified
        }
      })
    }

    console.log(`[Google Register] Registro completado exitosamente para: ${user.username}`)

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl
      },
      token
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('Error en registro Google:', error)
      res.status(500).json({ error: 'Error al completar el registro' })
    }
  }
})

router.get('/check-username/:username', async (req: Request, res: Response) => {
  try {
    const username = req.params.username as string
    
    if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.json({ available: false, message: 'Formato inválido' })
    }

    if (filter.isProfane(username)) {
      return res.json({ available: false, message: 'Inapropiado' })
    }

    const user = await prisma.user.findUnique({ where: { username } })
    res.json({ available: !user })
  } catch (error: unknown) {
    res.status(500).json({ error: 'Error al verificar disponibilidad' })
  }
})

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new ValidationError('El email ya está registrado')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone: phone || null,
        role: 'CUSTOMER',
        verificationToken,
        verificationTokenExpires,
        emailVerified: false,
      },
    })

    // Enviar correo de verificación
    try {
      await emailService.sendVerificationEmail(user.email, verificationToken, user.name || 'Usuario')
    } catch (emailError) {
      console.error('Error al enviar correo de verificación:', emailError)
      // No bloqueamos el registro si falla el envío de correo, pero informamos
    }

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      }
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('Error en registro:', error)
      res.status(500).json({ error: 'Error al registrar usuario' })
    }
  }
})

router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body

    if (!token) {
      throw new ValidationError('Token de verificación requerido')
    }

    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpires: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      throw new ValidationError('Token inválido o expirado')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpires: null
      }
    })

    res.json({
      success: true,
      message: 'Correo electrónico verificado exitosamente'
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('Error en verificación de email:', error)
      res.status(500).json({ error: 'Error al verificar el correo' })
    }
  }
})

router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      throw new ValidationError('Email requerido')
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new ValidationError('Usuario no encontrado')
    }

    if (user.emailVerified) {
      return res.json({ success: true, message: 'El correo ya está verificado' })
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpires
      }
    })

    await emailService.sendVerificationEmail(user.email, verificationToken, user.name || 'Usuario')

    res.json({
      success: true,
      message: 'Correo de verificación reenviado'
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('Error al reenviar verificación:', error)
      res.status(500).json({ error: 'Error al reenviar el correo de verificación' })
    }
  }
})

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      throw new ValidationError('Email requerido')
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      // Por seguridad, no informamos si el email no existe
      return res.json({ 
        success: true, 
        message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' 
      })
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex')
    const resetPasswordExpires = new Date(Date.now() + 3600000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires
      }
    })

    await emailService.sendPasswordResetEmail(user.email, resetPasswordToken)

    res.json({
      success: true,
      message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.'
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('Error en forgot-password:', error)
      res.status(500).json({ error: 'Error al procesar la solicitud' })
    }
  }
})

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      throw new ValidationError('Token y nueva contraseña requeridos')
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      throw new ValidationError('Token inválido o expirado')
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    })

    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('Error en reset-password:', error)
      res.status(500).json({ error: 'Error al restablecer la contraseña' })
    }
  }
})

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new ValidationError('Credenciales inválidas')
    }

    if (!user.isActive) {
      throw new ValidationError('Cuenta desactivada')
    }

    if (!user.passwordHash) {
      throw new ValidationError('Esta cuenta está vinculada a Google. Por favor, inicia sesión con Google.')
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      throw new ValidationError('Credenciales inválidas')
    }

    // Bloquear login si no está verificado
    if (!user.emailVerified) {
      throw new ValidationError('Por favor, verifica tu correo electrónico antes de iniciar sesión')
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      },
      token,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('Error en login:', error)
      res.status(500).json({ error: 'Error al iniciar sesión' })
    }
  }
})

router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ValidationError('Token requerido')
    }

    const token = authHeader.split(' ')[1]

    let decoded: { userId: string; email: string; role: string }
    try {
      decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string; role: string }
    } catch {
      throw new ValidationError('Token inválido')
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' })
    }

    const userData: any = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }

    if ((user as any).avatarUrl) {
      userData.avatarUrl = (user as any).avatarUrl
    }

    res.json(userData)
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return res.status(401).json({ error: error.message })
    }
    console.error('Error en /me:', error)
    res.status(500).json({ error: 'Error al obtener datos del usuario' })
  }
})

router.patch('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ValidationError('Token requerido')
    }

    const token = authHeader.split(' ')[1]
    let decoded: { userId: string }
    try {
      decoded = jwt.verify(token, config.jwtSecret) as { userId: string }
    } catch {
      throw new ValidationError('Token inválido')
    }

    const { name, phone, avatarUrl } = req.body

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name,
        phone,
        avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        avatarUrl: true,
      }
    })

    res.json(user)
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('Error al actualizar perfil:', error)
      res.status(500).json({ error: 'Error al actualizar el perfil' })
    }
  }
})

export default router
