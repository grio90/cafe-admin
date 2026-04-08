import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import * as ctrl from './reports.controller'

const router = Router()
router.use(authenticate, requireAdmin)

router.get('/monthly', ctrl.monthly)
router.get('/payment-methods', ctrl.paymentMethods)
router.get('/top-products', ctrl.topProducts)
router.get('/daily', ctrl.daily)

export default router
