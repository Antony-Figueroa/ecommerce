import { Router } from 'express'
import { getCustomers, getCustomer, getCustomerOrders, updateCustomer, deleteCustomer } from '../../controllers/customer.controller.js'
import { authenticate } from '../../middleware/auth.js'
import { validate, customerUpdateSchema } from '../../middleware/validation.js'

const router = Router()

router.use(authenticate)

router.get('/', getCustomers)
router.get('/:id', getCustomer)
router.get('/:customerId/orders', getCustomerOrders)
router.put('/:id', validate(customerUpdateSchema), updateCustomer)
router.delete('/:id', deleteCustomer)

export default router
