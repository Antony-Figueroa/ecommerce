import { Router, Request, Response } from 'express'
import { authService } from '../../../shared/container.js'
import { validate, registerSchema, loginSchema, googleRegisterSchema } from '../middleware/validation.middleware.js'
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js'
import { Filter } from 'bad-words'

const router = Router()
const filter = new Filter()

// Palabras ofensivas adicionales en español
filter.addWords('pendejo', 'puto', 'puta', 'mierda', 'carajo', 'culero', 'cabron', 'chingar', 'pajuo', 'mamaguevo')

router.post('/callback/g', async (req: Request, res: Response) => {
  console.log('[DEBUG] Petición recibida en /api/auth/callback/g');
  console.log('[DEBUG] Body:', JSON.stringify(req.body));
  console.log('[DEBUG] Headers:', JSON.stringify(req.headers));
  try {
    const { credential } = req.body
    if (!credential) {
      console.warn('[DEBUG] No se recibió credencial en el body');
      return res.status(400).json({ error: 'No se recibió la credencial de Google' });
    }
    console.log('[DEBUG] Intentando autenticación con Google...');
    const result = await authService.googleAuth(credential)
    console.log('[DEBUG] Autenticación exitosa:', result.requiresRegistration ? 'Requiere registro' : 'Login directo');
    res.json({ success: true, ...result })
  } catch (error: any) {
    console.error('[DEBUG] Error en Google Auth:', error)
    // Asegurarse de que el error tenga un status válido para Express
    const statusCode = error.statusCode || error.status || 400;
    res.status(statusCode).json({ 
      error: error.message || 'Error en autenticación con Google',
      code: error.code || 'GOOGLE_AUTH_ERROR'
    })
  }
})

router.post('/google/register', validate(googleRegisterSchema), async (req: Request, res: Response) => {
  try {
    const { username } = req.body

    // Validar profanidad en username
    if (filter.isProfane(username)) {
      return res.status(400).json({ error: 'El nombre de usuario contiene palabras inapropiadas' })
    }

    const result = await authService.completeGoogleRegistration(req.body)
    res.status(201).json({ success: true, ...result })
  } catch (error: any) {
    console.error('Error en registro Google:', error)
    res.status(error.status || 500).json({ error: error.message || 'Error al completar el registro' })
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

    // This could be a method in authService or userService
    // For now, let's use the repository indirectly via service if possible, 
    // but authService doesn't have checkUsername. Let's add it or use repo.
    // Actually, we can add a method to authService.
    const available = await authService.checkUsernameAvailability(username)
    res.json({ available })
  } catch (error: any) {
    res.status(500).json({ error: 'Error al verificar disponibilidad' })
  }
})

router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body)
    res.status(201).json({
      success: true,
        message: 'Usuario registrado exitosamente.',
      user
    })
  } catch (error: any) {
    console.error('Error en registro:', error)
    res.status(error.status || 500).json({ error: error.message || 'Error al registrar usuario' })
  }
})

router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body
    await authService.verifyEmail(token)
    res.json({
      success: true,
      message: 'Correo electrónico verificado exitosamente'
    })
  } catch (error: any) {
    console.error('Error en verificación de email:', error)
    res.status(error.status || 400).json({ error: error.message || 'Error al verificar el correo' })
  }
})

router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    await authService.resendVerificationEmail(email)
    res.json({
      success: true,
      message: 'Correo de verificación reenviado'
    })
  } catch (error: any) {
    console.error('Error al reenviar verificación:', error)
    res.status(error.status || 400).json({ error: error.message || 'Error al reenviar el correo de verificación' })
  }
})

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    await authService.requestPasswordReset(email)
    res.json({
      success: true, 
      message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.' 
    })
  } catch (error: any) {
    console.error('Error en forgot-password:', error)
    res.status(500).json({ error: 'Error al procesar la solicitud' })
  }
})

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body
    await authService.resetPassword(token, password)
    res.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    })
  } catch (error: any) {
    console.error('Error en reset-password:', error)
    res.status(error.status || 400).json({ error: error.message || 'Error al restablecer la contraseña' })
  }
})

router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body.email, req.body.password)
    res.json(result)
  } catch (error: any) {
    console.error('Error en login:', error)
    res.status(error.status || 401).json({ error: error.message || 'Error al iniciar sesión' })
  }
})

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' })
    }
    const user = await authService.getCurrentUser(req.user.id)
    res.json(user)
  } catch (error: any) {
    console.error('Error en /me:', error)
    res.status(401).json({ error: error.message || 'Error al obtener datos del usuario' })
  }
})

router.patch('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' })
    }
    const user = await authService.updateProfile(req.user.id, req.body)
    res.json(user)
  } catch (error: any) {
    console.error('Error al actualizar perfil:', error)
    res.status(error.status || 500).json({ error: error.message || 'Error al actualizar el perfil' })
  }
})

export default router
