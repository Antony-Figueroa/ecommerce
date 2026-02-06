export class ApiError extends Error {
  public statusCode: number
  public code: string
  public details?: unknown

  constructor(statusCode: number, message: string, code: string = 'ERROR', details?: unknown) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details)
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'No autorizado') {
    super(401, message, 'UNAUTHORIZED')
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Acceso denegado') {
    super(403, message, 'FORBIDDEN')
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Recurso') {
    super(404, `${resource} no encontrado`, 'NOT_FOUND')
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(409, message, 'CONFLICT')
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Demasiadas solicitudes') {
    super(429, message, 'TOO_MANY_REQUESTS')
  }
}
