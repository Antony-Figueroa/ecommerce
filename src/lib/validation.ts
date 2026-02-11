import { z } from "zod"

/**
 * Esquemas de validación reutilizables basados en los requerimientos:
 * - Teléfono: 10-15 dígitos numéricos.
 * - Nombres/Apellidos: Letras y espacios, 2-50 caracteres.
 * - Email: Formato RFC 5322.
 * - Edad: 1-120 años.
 * - Código Postal: Solo dígitos.
 */

export const validationRules = {
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder los 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se permiten letras y espacios"),
  
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

  age: z
    .number()
    .int()
    .min(1, "La edad mínima es 1 año")
    .max(120, "La edad máxima es 120 años"),

  zipCode: z
    .string()
    .regex(/^\d+$/, "El código postal solo debe contener números")
    .min(4, "El código postal es demasiado corto")
    .max(10, "El código postal es demasiado largo"),

  username: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(20, "El nombre de usuario no puede exceder los 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo se permiten letras, números y guiones bajos"),
}

// Esquema para el registro
export const registerSchema = z.object({
  name: validationRules.name,
  email: validationRules.email,
  phone: validationRules.phone.optional().or(z.literal("")),
  password: validationRules.password,
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

// Esquema para el login
export const loginSchema = z.object({
  email: validationRules.email,
  password: z.string().min(1, "La contraseña es obligatoria"),
})

export const googleRegisterSchema = z.object({
  googleId: z.string().min(1, "Google ID requerido"),
  email: validationRules.email,
  name: validationRules.name,
  avatarUrl: z.string().optional().nullable(),
  username: validationRules.username,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
