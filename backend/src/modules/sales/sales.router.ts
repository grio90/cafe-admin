import { Router } from 'express'
import { authenticate, requireAdmin } from '../../middleware/auth.middleware'
import * as ctrl from './sales.controller'

const router = Router()
router.use(authenticate)

router.get('/', ctrl.list)
router.post('/', ctrl.create)
router.get('/:id', ctrl.getById)
router.delete('/:id', requireAdmin, ctrl.remove)

export default router
