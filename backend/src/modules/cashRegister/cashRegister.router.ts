import { Router } from 'express'
import { authenticate } from '../../middleware/auth.middleware'
import * as ctrl from './cashRegister.controller'

const router = Router()
router.use(authenticate)

router.get('/', ctrl.list)
router.get('/today', ctrl.today)
router.post('/open', ctrl.open)
router.get('/:id', ctrl.getById)
router.get('/:id/summary', ctrl.summary)
router.post('/:id/close', ctrl.close)

export default router
