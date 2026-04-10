import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import * as ctrl from './orders.controller'

const router = Router()

// Public: customer creates order (no auth)
router.post('/public', ctrl.createPublicOrder)
router.get('/public/:id', ctrl.getPublicOrder)

// Admin/cashier: manage orders
router.get('/', authenticate, ctrl.list)
router.get('/:id', authenticate, ctrl.getById)
router.patch('/:id/status', authenticate, ctrl.updateStatus)
router.delete('/:id', authenticate, requireAdmin, ctrl.cancel)

export default router
