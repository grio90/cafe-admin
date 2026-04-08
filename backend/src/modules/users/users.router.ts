import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import * as ctrl from './users.controller'

const router = Router()
router.use(authenticate, requireAdmin)

router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.patch('/:id', ctrl.update)
router.patch('/:id/reset-password', ctrl.resetPassword)
router.delete('/:id', ctrl.remove)

export default router
