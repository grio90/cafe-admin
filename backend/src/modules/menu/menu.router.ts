import { Router } from 'express'
import * as ctrl from './menu.controller'

const router = Router()

// Public — no auth required
router.get('/:slug', ctrl.getMenu)
router.get('/:slug/table/:qrToken', ctrl.getTableMenu)

export default router
