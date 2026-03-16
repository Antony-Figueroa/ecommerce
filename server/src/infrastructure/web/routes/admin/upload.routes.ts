import { Router, Request, Response } from 'express'
import multer from 'multer'
import { uploadService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes'))
    }
  },
})

router.use(authenticate)

router.post('/images', upload.array('images', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se subieron imágenes' })
    }

    const results = await Promise.all(
      files.map(file => uploadService.processImage(file))
    )

    res.status(201).json(results)
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Error al procesar las imágenes' })
  }
})

export default router

