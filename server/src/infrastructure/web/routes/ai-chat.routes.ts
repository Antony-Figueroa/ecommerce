import { Router, Request, Response } from 'express'
import { aiChatService } from '../../../shared/container.js'

const router = Router()

/**
 * @route POST /api/chat
 * @desc Enviar un mensaje al chat con IA
 * @access Public
  */
router.post('/', async (req: Request, res: Response) => {
  const { message, history } = req.body

  if (!message) {
    return res.status(400).json({ error: 'Message is required' })
  }

  try {
    const response = await aiChatService.chat(message, history || [])
    res.json({ response })
  } catch (error) {
    console.error('Error in chat route:', error)
    res.status(500).json({ error: 'Failed to process chat message' })
  }
})

export default router
