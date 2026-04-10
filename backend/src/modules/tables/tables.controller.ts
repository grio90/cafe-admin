import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import prisma from '../../shared/prisma'
import { z } from 'zod'
import { AppError, NotFoundError } from '../../shared/errors'
import { randomUUID } from 'crypto'

const schema = z.object({
  number: z.string().min(1, 'Número de mesa requerido'),
  isActive: z.boolean().optional(),
})

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant', 400)
    const tables = await prisma.table.findMany({
      where: { tenantId: req.tenantId },
      include: {
        _count: { select: { orders: true } },
        orders: {
          where: { status: { notIn: ['DELIVERED', 'CANCELLED'] } },
          select: { id: true, status: true, total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { number: 'asc' },
    })
    res.json(tables)
  } catch (e) { next(e) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant', 400)
    const { number, isActive } = schema.parse(req.body)

    const existing = await prisma.table.findFirst({ where: { tenantId: req.tenantId, number } })
    if (existing) throw new AppError(`Ya existe la mesa "${number}"`, 400)

    const table = await prisma.table.create({
      data: { number, isActive, tenantId: req.tenantId, qrToken: randomUUID() },
    })
    res.status(201).json(table)
  } catch (e) { next(e) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant', 400)
    const data = schema.partial().parse(req.body)
    const table = await prisma.table.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } })
    if (!table) throw new NotFoundError('Mesa')
    res.json(await prisma.table.update({ where: { id: req.params.id }, data }))
  } catch (e) { next(e) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant', 400)
    const table = await prisma.table.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } })
    if (!table) throw new NotFoundError('Mesa')
    await prisma.table.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ ok: true })
  } catch (e) { next(e) }
}

export async function regenerateQr(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant', 400)
    const table = await prisma.table.findFirst({ where: { id: req.params.id, tenantId: req.tenantId } })
    if (!table) throw new NotFoundError('Mesa')
    const updated = await prisma.table.update({
      where: { id: req.params.id },
      data: { qrToken: randomUUID() },
    })
    res.json(updated)
  } catch (e) { next(e) }
}
