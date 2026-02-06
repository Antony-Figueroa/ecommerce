import { Router, Request, Response } from 'express'
import { CatalogService } from '../../../application/services/catalog.service.js'
import { PrismaProductRepository } from '../../persistence/prisma.product.repository.js'
import { EmailService } from '../../../application/services/email.service.js'

const router = Router()
const productRepo = new PrismaProductRepository()
const emailService = new EmailService()
const catalogService = new CatalogService(productRepo, emailService)

router.post('/request', async (req: Request, res: Response) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    await catalogService.requestCatalog(email)
    res.json({ message: 'Catalog requested successfully' })
  } catch (error) {
    console.error('Error requesting catalog:', error)
    res.status(500).json({ error: 'Failed to request catalog' })
  }
})

export default router
