import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../../../shared/config/index.js'
import { userRepo } from '../../../shared/container.js'
import { AuthenticationError, AuthorizationError } from '../../../shared/errors/app.errors.js'

export interface AuthRequest extends Request {}

interface JWTPayload {
  userId: string
  email: string
  role: string
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      // Permitir autenticación vía query string para facturas/archivos
      token = req.query.token as string;
    }

    if (!token) {
      throw new AuthenticationError('Token de autenticación requerido')
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload

      const user = await userRepo.findById(decoded.userId)

      if (!user) {
        throw new AuthenticationError('Usuario no encontrado')
      }

      if (!user.isActive) {
        throw new AuthenticationError('Usuario inactivo')
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      }

      next()
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expirado')
      }
      throw new AuthenticationError('Token inválido')
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: error.message,
        },
      })
      return
    }
    throw error
  }
}

export function authorize(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No autorizado',
        },
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Acceso denegado',
        },
      })
      return
    }

    next()
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload

      const user = await userRepo.findById(decoded.userId)

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      }
    }
    next()
  } catch {
    next()
  }
}

