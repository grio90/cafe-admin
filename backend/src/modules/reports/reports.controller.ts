import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import * as service from './reports.service'

export async function monthly(_req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await service.getMonthlyReport()) } catch (e) { next(e) }
}

export async function paymentMethods(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as Record<string, string>
    res.json(await service.getPaymentMethodBreakdown(from, to))
  } catch (e) { next(e) }
}

export async function topProducts(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as Record<string, string>
    res.json(await service.getTopProducts(from, to))
  } catch (e) { next(e) }
}

export async function daily(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { year, month } = req.query as Record<string, string>
    res.json(await service.getDailyReport(parseInt(year), parseInt(month)))
  } catch (e) { next(e) }
}
