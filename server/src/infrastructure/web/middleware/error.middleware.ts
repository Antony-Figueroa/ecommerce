import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ApiError } from '../../../shared/errors/app.errors.js'
import { sendError } from '../../../shared/utils/responses.js'

export class ErrorHandler {
  static handle(
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
  ): void {
    console.error('Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      path: req.path,
      method: req.method,
    })

    if (error instanceof ZodError) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Error de validación', error.issues)
      return
    }

    if (error instanceof ApiError) {
      sendError(
        res,
        error.statusCode,
        error.code,
        error.message,
        error.details
      )
      return
    }

    if (error instanceof Error) {
      sendError(res, 500, 'INTERNAL_ERROR', error.message)
      return
    }

    sendError(res, 500, 'INTERNAL_ERROR', 'Error interno del servidor')
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Ruta ${req.method} ${req.path} no encontrada`,
    },
  })
}

export function rateLimitHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(429).json({
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiadas solicitudes, por favor inténtalo más tarde',
    },
  })
}

