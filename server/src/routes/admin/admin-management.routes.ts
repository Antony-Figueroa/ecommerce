import { Router } from 'express'
import { createAdmin, getAdmins } from '../../controllers/admin-user.controller.js'
import { authenticate, authorize } from '../../middleware/auth.js'
import { validate, adminCreateSchema } from '../../middleware/validation.js'

const router = Router()

// Todas las rutas requieren ser ADMIN
router.use(authenticate, authorize('ADMIN'))

router.get('/', getAdmins)
router.post('/', validate(adminCreateSchema), createAdmin)

export default router
