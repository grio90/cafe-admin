import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import * as ctrl from './categories.controller'

const router = Router()
router.use(authenticate)

router.get('/', ctrl.list)
router.post('/', requireAdmin, ctrl.create)
router.patch('/:id', requireAdmin, ctrl.update)
router.delete('/:id', requireAdmin, ctrl.remove)

export default router
