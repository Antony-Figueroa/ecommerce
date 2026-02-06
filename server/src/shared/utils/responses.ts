import { Response } from 'express'

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: ApiResponse<T>['meta']
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  }
  return res.status(statusCode).json(response)
}

export function sendCreated<T>(
  res: Response,
  data: T,
  meta?: ApiResponse<T>['meta']
): Response {
  return sendSuccess(res, data, 201, meta)
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  page: number = 1,
  limit: number = 10,
  total: number
): Response {
  const totalPages = Math.ceil(total / limit)
  return sendSuccess(res, data, 200, {
    page,
    limit,
    total,
    totalPages,
  })
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): Response {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  })
}

export function sendValidationError(
  res: Response,
  message: string,
  details?: unknown
): Response {
  return sendError(res, 400, 'VALIDATION_ERROR', message, details)
}

export function sendAuthenticationError(
  res: Response,
  message: string = 'No autorizado'
): Response {
  return sendError(res, 401, 'UNAUTHORIZED', message)
}

export function sendAuthorizationError(
  res: Response,
  message: string = 'Acceso denegado'
): Response {
  return sendError(res, 403, 'FORBIDDEN', message)
}

export function sendNotFound(
  res: Response,
  resource: string = 'Recurso'
): Response {
  return sendError(res, 404, 'NOT_FOUND', `${resource} no encontrado`)
}

export function sendConflict(
  res: Response,
  message: string
): Response {
  return sendError(res, 409, 'CONFLICT', message)
}

export function sendTooManyRequests(
  res: Response,
  message: string = 'Demasiadas solicitudes'
): Response {
  return sendError(res, 429, 'TOO_MANY_REQUESTS', message)
}

export function sendInternalError(
  res: Response,
  message: string = 'Error interno del servidor'
): Response {
  console.error('Internal Error:', message)
  return sendError(res, 500, 'INTERNAL_ERROR', message)
}
