import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { config } from '../../shared/config/index.js'
import { ValidationError, AuthenticationError } from '../../shared/errors/app.errors.js'
import { UserRepository } from '../../domain/repositories/user.repository.js'
import { EmailService } from './email.service.js'

export class AuthService {
  private googleClient: OAuth2Client

  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService
  ) {
    this.googleClient = new OAuth2Client(config.googleClientId)
  }

  async login(email: string, pass: string) {
    const user = await this.userRepo.findByEmail(email)
    if (!user || !user.passwordHash) {
      throw new AuthenticationError('Credenciales inválidas')
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash)
    if (!isMatch) {
      throw new AuthenticationError('Credenciales inválidas')
    }

    if (!user.emailVerified) {
      throw new AuthenticationError('Por favor verifica tu correo electrónico para continuar')
    }

    const token = this.generateToken(user)
    return { user: this.sanitizeUser(user), token }
  }

  async register(data: any) {
    const { email, password, name, username } = data

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

    const hashedPassword = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')

    const user = await this.userRepo.create({
      email,
      passwordHash: hashedPassword,
      name,
      username,
      verificationToken,
      role: 'USER'
    })

    await this.emailService.sendVerificationEmail(email, verificationToken, name)

    return this.sanitizeUser(user)
  }

  async verifyEmail(token: string) {
    const user = await this.userRepo.findByVerificationToken(token)
    if (!user) {
      throw new ValidationError('Token de verificación inválido o expirado')
    }

    await this.userRepo.update(user.id, {
      emailVerified: true,
      verificationToken: null
    })

    return true
  }

  async googleAuth(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
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

    let user = await this.userRepo.findFirst({
      OR: [{ googleId }, { email }]
    })

    if (user) {
      if (!user.googleId) {
        user = await this.userRepo.update(user.id, {
          googleId,
          avatarUrl: avatarUrl || user.avatarUrl
        })
      }

      if (user.username) {
        const token = this.generateToken(user)
        return { requiresRegistration: false, user: this.sanitizeUser(user), token }
      }
    }

    return {
      requiresRegistration: true,
      googleData: { googleId, email, name, avatarUrl }
    }
  }

  async completeGoogleRegistration(data: any) {
    const { email, googleId, name, username, avatarUrl, password } = data

    if (username) {
      const existingUsername = await this.userRepo.findByUsername(username)
      if (existingUsername) {
        throw new ValidationError('El nombre de usuario ya está en uso')
      }
    }

    const passwordHash = password ? await bcrypt.hash(password, 12) : undefined
    let user = await this.userRepo.findByEmail(email)

    if (user) {
      user = await this.userRepo.update(user.id, {
        googleId,
        username,
        name: name || user.name,
        avatarUrl: avatarUrl || user.avatarUrl,
        emailVerified: true,
        passwordHash: passwordHash || user.passwordHash
      })
    } else {
      user = await this.userRepo.create({
        email,
        googleId,
        username,
        name,
        avatarUrl,
        passwordHash,
        emailVerified: true,
        role: 'USER'
      })
    }

    const token = this.generateToken(user)
    return { user: this.sanitizeUser(user), token }
  }

  async checkUsernameAvailability(username: string) {
    const user = await this.userRepo.findByUsername(username)
    return !user
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userRepo.findByEmail(email)
    if (!user) {
      throw new ValidationError('Usuario no encontrado')
    }

    if (user.emailVerified) {
      throw new ValidationError('El correo ya está verificado')
    }

    const verificationToken = crypto.randomBytes(32).toString('hex')
    await this.userRepo.update(user.id, { verificationToken })
    await this.emailService.sendVerificationEmail(email, verificationToken, user.name || '')
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepo.findById(userId)
    if (!user) {
      throw new ValidationError('Usuario no encontrado')
    }
    return this.sanitizeUser(user)
  }

  async updateProfile(userId: string, data: any) {
    const { name, phone, avatarUrl, password } = data
    
    const updateData: any = { name, phone, avatarUrl }
    
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }
    
    const user = await this.userRepo.update(userId, updateData)
    return this.sanitizeUser(user)
  }

  async requestPasswordReset(email: string) {
    const user = await this.userRepo.findByEmail(email)
    if (!user) return // Don't reveal if user exists

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 3600000) // 1 hour

    await this.userRepo.update(user.id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires
    })

    await this.emailService.sendPasswordResetEmail(email, resetToken)
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findFirst({
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() }
    })

    if (!user) {
      throw new ValidationError('Token inválido o expirado')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await this.userRepo.update(user.id, {
      passwordHash: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    })

    return true
  }

  private generateToken(user: any) {
    return jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    )
  }

  private sanitizeUser(user: any) {
    const { passwordHash, verificationToken, resetPasswordToken, resetPasswordExpires, ...sanitized } = user
    return sanitized
  }
}
