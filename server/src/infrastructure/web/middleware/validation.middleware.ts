import { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'
import { ValidationError } from '../../../shared/errors/app.errors.js'

export function validate(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req.body)
      req.body = data
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        next(new ValidationError(messages))
      } else {
        next(error)
      }
    }
  }
}

export const authRules = {
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder los 50 caracteres"),
  
  email: z
    .string()
    .min(1, "El correo electrónico es obligatorio")
    .email("Ingresa un correo electrónico válido"),

  phone: z
    .string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(15, "El teléfono no puede exceder los 15 dígitos")
    .regex(/^\d+$/, "Solo se permiten números"),

  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/\d/, "Debe contener al menos un número"),

  username: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(20, "El nombre de usuario no puede exceder los 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo se permiten letras, números y guiones bajos"),
}

export const registerSchema = z.object({
  name: authRules.name,
  email: authRules.email,
  phone: authRules.phone.optional().nullable(),
  password: authRules.password,
})

export const googleRegisterSchema = z.object({
  googleId: z.string().min(1, "Google ID requerido"),
  email: authRules.email,
  name: authRules.name,
  avatarUrl: z.string().optional().nullable(),
  username: authRules.username,
})

export const loginSchema = z.object({
  email: authRules.email,
  password: z.string().min(1, "La contraseña es obligatoria"),
})

export const adminCreateSchema = z.object({
  name: authRules.name,
  email: authRules.email,
  phone: authRules.phone.optional().nullable(),
  password: authRules.password,
  username: authRules.username.optional().nullable(),
})

export const productCreateSchema = z.object({
  sku: z.string().max(50).optional().nullable().or(z.literal('')),
  name: z.string().min(3).max(200),
  description: z.string().min(10),
  price: z.number().positive(),
  purchasePrice: z.number().positive("El precio de compra es obligatorio y debe ser mayor a 0"),
  profitMargin: z.number().positive().optional().default(1.5),
  image: z.string().optional().nullable().or(z.literal('')),
  images: z.array(z.object({
    url: z.string(),
    thumbnail: z.string().optional().nullable(),
    medium: z.string().optional().nullable(),
    large: z.string().optional().nullable(),
    isMain: z.boolean().optional(),
    sortOrder: z.number().optional(),
  })).optional(),
  categoryId: z.string().optional(),
  categoryIds: z.array(z.string()).min(1, "Debe seleccionar al menos una categoría"),
  brand: z.string().min(1).max(100),
  format: z.string().min(1).max(50),
  weight: z.string().optional().nullable().or(z.literal('')),
  stock: z.number().int().nonnegative().optional().default(0),
  minStock: z.number().int().nonnegative().optional().default(5),
  inStock: z.boolean().optional().default(true),
  isActive: z.boolean().optional().default(true),
  isFeatured: z.boolean().optional().default(false),
  isOffer: z.boolean().optional().default(false),
  originalPrice: z.number().nonnegative().optional().nullable(),
  batchNumber: z.string().optional(),
  expirationDate: z.string().optional().nullable(),
})

export const productUpdateSchema = productCreateSchema.partial().extend({
  batch: z.object({
    batchNumber: z.string().min(1, "El número de lote es obligatorio"),
    expirationDate: z.string().min(1, "La fecha de vencimiento es obligatoria"),
    stock: z.number().int().positive("La cantidad debe ser mayor a 0"),
    purchasePrice: z.number().positive("El precio de compra es obligatorio"),
    salePrice: z.number().positive().optional(),
  }).optional()
})

export const categoryCreateSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  image: z.string().url().nullable().optional(),
  icon: z.string().optional(),
  sortOrder: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
})

export const categoryUpdateSchema = categoryCreateSchema.partial()

export const saleCreateSchema = z.object({
  userId: z.string().uuid().optional(),
  customerName: z.string().min(2).optional(),
  customerPhone: z.string().min(7).optional(),
  customerEmail: z.string().email().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  paymentMethod: z.string().optional().default('WHATSAPP'),
  items: z.array(z.object({
    productId: z.string().uuid(),
    name: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
  })).min(1),
  shippingCost: z.number().nonnegative().optional().default(0),
  bcvRate: z.number().positive().optional(),
  notes: z.string().optional(),
})

export const requirementCreateSchema = z.object({
  supplier: z.string().min(2),
  items: z.array(z.object({
    productId: z.string().uuid(),
    name: z.string(),
    quantity: z.number().int().positive(),
    unitCost: z.number().positive(),
    batchNumber: z.string().optional(),
    expirationDate: z.string().datetime().or(z.date()).optional(),
  })).min(1),
  notes: z.string().optional(),
})

export const customerUpdateSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  phone: z.string().min(7).optional(),
  isActive: z.boolean().optional(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  search: z.string().optional(),
})

export function validateProductCreate(req: Request, _res: Response, next: NextFunction) {
  const { name, description, price, categoryIds, categoryId, brand, format } = req.body

  const errors: string[] = []

  if (!name || name.length < 3) {
    errors.push('Nombre debe tener al menos 3 caracteres')
  }
  if (!description || description.length < 10) {
    errors.push('Descripción debe tener al menos 10 caracteres')
  }
  if (!price || parseFloat(price) <= 0) {
    errors.push('Precio debe ser mayor a 0')
  }
  
  const hasCategories = (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) || categoryId;
  if (!hasCategories) {
    errors.push('Al menos una categoría es requerida')
  }
  if (!brand || brand.length < 1) {
    errors.push('Marca es requerida')
  }
  if (!format || format.length < 1) {
    errors.push('Formato es requerido')
  }

  if (errors.length > 0) {
    next(new ValidationError(errors.join(', ')))
    return
  }

  next()
}

export function validateProductUpdate(req: Request, _res: Response, next: NextFunction) {
  const { name, description, price } = req.body

  const errors: string[] = []

  if (name && name.length < 3) {
    errors.push('Nombre debe tener al menos 3 caracteres')
  }
  if (description && description.length < 10) {
    errors.push('Descripción debe tener al menos 10 caracteres')
  }
  if (price && parseFloat(price) <= 0) {
    errors.push('Precio debe ser mayor a 0')
  }

  if (errors.length > 0) {
    next(new ValidationError(errors.join(', ')))
    return
  }

  next()
}

export function validateCategory(req: Request, _res: Response, next: NextFunction) {
  const { name } = req.body

  if (!name || name.length < 2) {
    next(new ValidationError('Nombre debe tener al menos 2 caracteres'))
    return
  }

  next()
}

