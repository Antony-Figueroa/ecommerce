/// <reference types="express" />
/// <reference types="multer" />

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: string
      }
    }
  }
}

export {}
