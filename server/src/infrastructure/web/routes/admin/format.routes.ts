import { Router, Request, Response } from 'express'
import { inventoryService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req: Request, res: Response) => {
    try {
        const onlyActive = req.query.onlyActive !== 'false'
        const formats = await inventoryService.getAllFormats({ onlyActive })
        res.json(formats)
    } catch (error) {
        console.error('Error al obtener formatos:', error)
        res.status(500).json({ error: 'Error al obtener formatos' })
    }
})

router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id
        const ipAddress = req.ip
        const userAgent = req.get('User-Agent')
        const format = await inventoryService.createFormat(req.body, userId, ipAddress, userAgent)
        res.status(201).json(format)
    } catch (error) {
        console.error('Error al crear formato:', error)
        res.status(500).json({ error: 'Error al crear formato' })
    }
})

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id
        const ipAddress = req.ip
        const userAgent = req.get('User-Agent')
        const format = await inventoryService.updateFormat(req.params.id, req.body, userId, ipAddress, userAgent)
        res.json(format)
    } catch (error) {
        console.error('Error al actualizar formato:', error)
        res.status(500).json({ error: 'Error al actualizar formato' })
    }
})

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id
        const ipAddress = req.ip
        const userAgent = req.get('User-Agent')
        await inventoryService.deleteFormat(req.params.id, userId, ipAddress, userAgent)
        res.json({ success: true })
    } catch (error) {
        console.error('Error al eliminar formato:', error)
        res.status(500).json({ error: 'Error al eliminar formato' })
    }
})

export default router
