import { Router } from 'express'
import { authenticate, requireSuperAdmin, requireAdmin } from '../../middleware/auth.middleware'
import * as ctrl from './tenants.controller'

const router = Router()

// Super admin: manage all tenants
router.get('/', authenticate, requireSuperAdmin, ctrl.list)
router.post('/', authenticate, requireSuperAdmin, ctrl.create)
router.patch('/:id', authenticate, requireSuperAdmin, ctrl.update)
router.delete('/:id', authenticate, requireSuperAdmin, ctrl.remove)

// Admin: get & update own tenant
router.get('/me', authenticate, requireAdmin, ctrl.getMyTenant)
router.patch('/me/settings', authenticate, requireAdmin, ctrl.updateMyTenant)

export default router
