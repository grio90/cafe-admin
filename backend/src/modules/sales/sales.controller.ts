import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import * as service from './sales.service'
import { z } from 'zod'
import { PaymentMethod } from '@prisma/client'

const createSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  })).min(1, 'Se requiere al menos un producto'),
})

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { from, to, paymentMethod, cashRegisterId } = req.query as Record<string, string>
    res.json(await service.listSales({ from, to, paymentMethod, cashRegisterId, tenantId: req.tenantId! }))
  } catch (e) { next(e) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body)
    res.status(201).json(await service.createSale(req.userId!, data.paymentMethod, data.items, req.tenantId as string, data.notes))
  } catch (e) { next(e) }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.getSaleById(req.params.id))
  } catch (e) { next(e) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await service.voidSale(req.params.id)
    res.json({ message: 'Venta anulada' })
  } catch (e) { next(e) }
}
