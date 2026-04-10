import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import * as service from './cashRegister.service'
import { z } from 'zod'

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query as Record<string, string>
    res.json(await service.listRegisters(req.tenantId as string, from, to))
  } catch (e) { next(e) }
}

export async function today(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const reg = await service.getTodayRegister(req.tenantId as string)
    if (!reg) return res.json(null)
    res.json(await service.getRegisterWithLiveTotals(reg.id))
  } catch (e) { next(e) }
}

export async function open(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { openingCashAmount } = z.object({ openingCashAmount: z.number().min(0) }).parse(req.body)
    res.status(201).json(await service.openRegister(req.userId!, openingCashAmount, req.tenantId as string))
  } catch (e) { next(e) }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getRegisterWithLiveTotals(req.params.id))
  } catch (e) { next(e) }
}

export async function summary(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const totals = await service.computeLiveTotals(req.params.id)
    res.json(totals)
  } catch (e) { next(e) }
}

export async function close(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { closingNotes } = z.object({ closingNotes: z.string().optional() }).parse(req.body)
    res.json(await service.closeRegister(req.params.id, req.userId!, closingNotes))
  } catch (e) { next(e) }
}
