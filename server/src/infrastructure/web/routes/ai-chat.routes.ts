import { Router, Request, Response } from 'express'
import { aiChatService } from '../../../shared/container.js'
import { optionalAuth, authenticate, authorize } from '../middleware/auth.middleware.js'

const router = Router()

/**
 * @route POST /api/chat
 * @desc Enviar un mensaje al chat con IA (Cliente)
 * @access Public (con contexto de usuario si está logueado)
 */
router.post('/', optionalAuth, async (req: Request, res: Response) => {
  const { message, history } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  try {
    const result = await aiChatService.chat(message, history || [], false)
    res.json(result)
  } catch (error) {
    console.error('Error in chat route:', error)
    res.status(500).json({ error: 'Failed to process chat message' })
  }
})

/**
 * @route POST /api/chat/admin OR /api/admin/chat/admin
 * @desc Enviar un mensaje al chat con IA (Administrador)
 * @access Private (Admin only)
 */
router.post('/admin', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const { message, history, image, analysisContext } = req.body

  console.log('[DEBUG_AI_CHAT] Recibida petición admin chat:', { 
    message, 
    historyLength: history?.length,
    hasImage: !!image,
    hasAnalysis: !!analysisContext,
    user: req.user?.id
  })

  if (!message && !image) {
    return res.status(400).json({ error: 'Message or image is required' })
  }

  try {
    const userId = (req as any).user?.id
    // Si hay contexto de análisis previo, lo inyectamos en el mensaje
    let finalMessage = message || ''
    if (analysisContext) {
      finalMessage = `[CONTEXTO DE ANÁLISIS PREVIO DE IMAGEN: ${JSON.stringify(analysisContext)}]\n\n${finalMessage}`
    }

    const result = await aiChatService.chat(finalMessage, history || [], true, userId, image)
    res.json(result)
  } catch (error) {
    console.error('Error in admin chat route:', error)
    res.status(500).json({ error: 'Failed to process admin chat message' })
  }
})

/**
 * @route POST /api/chat/analyze-image
 * @desc Analizar una imagen de producto antes de enviar el chat
 * @access Private (Admin only)
 */
router.post('/analyze-image', authenticate, authorize('ADMIN'), async (req: Request, res: Response) => {
  const { image } = req.body

  if (!image) {
    return res.status(400).json({ error: 'Image is required' })
  }

  try {
    const analysis = await aiChatService.analyzeProductImage(image)
    res.json(analysis)
  } catch (error) {
    console.error('Error analyzing image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image'
    res.status(500).json({ 
      error: errorMessage.includes('límite') ? errorMessage : 'Failed to analyze image',
      quotaExceeded: errorMessage.includes('límite')
    })
  }
})

export default router
