import { Router, Request, Response } from 'express'
import { inventoryService } from '../../../../shared/container.js'
import { authenticate } from '../../middleware/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req: Request, res: Response) => {
    try {
        const onlyActive = req.query.onlyActive !== 'false'
        const brands = await inventoryService.getAllBrands({ onlyActive })
        res.json(brands)
    } catch (error) {
        console.error('Error al obtener marcas:', error)
        res.status(500).json({ error: 'Error al obtener marcas' })
    }
})

router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id
        const ipAddress = req.ip
        const userAgent = req.get('User-Agent')
        const brand = await inventoryService.createBrand(req.body, userId, ipAddress, userAgent)
        res.status(201).json(brand)
    } catch (error) {
        console.error('Error al crear marca:', error)
        res.status(500).json({ error: 'Error al crear marca' })
    }
})

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id
        const ipAddress = req.ip
        const userAgent = req.get('User-Agent')
        const brand = await inventoryService.updateBrand(req.params.id, req.body, userId, ipAddress, userAgent)
        res.json(brand)
    } catch (error) {
        console.error('Error al actualizar marca:', error)
        res.status(500).json({ error: 'Error al actualizar marca' })
    }
})

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id
        const ipAddress = req.ip
        const userAgent = req.get('User-Agent')
        await inventoryService.deleteBrand(req.params.id, userId, ipAddress, userAgent)
        res.json({ success: true })
    } catch (error) {
        console.error('Error al eliminar marca:', error)
        res.status(500).json({ error: 'Error al eliminar marca' })
    }
})

export default router
