import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import prisma from '../../shared/prisma'
import { getTodayOpenRegister } from '../cashRegister/cashRegister.service'
import { AppError, NotFoundError } from '../../shared/errors'
import { z } from 'zod'

const createSchema = z.object({
  description: z.string().min(1, 'Descripción requerida'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  notes: z.string().optional(),
})

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { from, to, cashRegisterId } = req.query as Record<string, string>
    const where: Record<string, unknown> = {}
    if (from || to) {
      where.createdAt = {}
      if (from) (where.createdAt as Record<string, Date>).gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        ;(where.createdAt as Record<string, Date>).lte = toDate
      }
    }
    if (cashRegisterId) where.cashRegisterId = cashRegisterId
    res.json(await prisma.expense.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }))
  } catch (e) { next(e) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body)
    const register = await getTodayOpenRegister()
    res.status(201).json(await prisma.expense.create({
      data: { ...data, userId: req.userId!, cashRegisterId: register.id },
      include: { user: { select: { name: true } } },
    }))
  } catch (e) { next(e) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const expense = await prisma.expense.findUnique({ where: { id: req.params.id }, include: { cashRegister: true } })
    if (!expense) throw new NotFoundError('Egreso')
    if (expense.cashRegister?.status === 'CLOSED') throw new AppError('No se puede eliminar un egreso de una caja cerrada', 400)
    await prisma.expense.delete({ where: { id: req.params.id } })
    res.json({ message: 'Egreso eliminado' })
  } catch (e) { next(e) }
}
