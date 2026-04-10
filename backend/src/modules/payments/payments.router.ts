import { Router } from 'express'
import * as ctrl from './payments.controller'

const router = Router()

// Called by customer to initiate MP payment
router.post('/create-preference', ctrl.createPreference)

// Webhook called by Mercado Pago
router.post('/webhook', ctrl.webhook)

export default router
