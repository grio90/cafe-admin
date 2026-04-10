import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import prisma from '../../shared/prisma'
import { z } from 'zod'
import { NotFoundError } from '../../shared/errors'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser mayor a 0'),
  categoryId: z.string().min(1, 'Categoría requerida'),
  isActive: z.boolean().optional(),
})

const include = { category: { select: { id: true, name: true, color: true } } }

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const activeOnly = req.query.active !== 'false'
    res.json(await prisma.product.findMany({
      where: { tenantId: req.tenantId!, isActive: activeOnly ? true : undefined },
      include,
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    }))
  } catch (e) { next(e) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = schema.parse(req.body)
    res.status(201).json(await prisma.product.create({ data: { ...data, tenantId: req.tenantId! }, include }))
  } catch (e) { next(e) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = schema.partial().parse(req.body)
    const p = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!p) throw new NotFoundError('Producto')
    res.json(await prisma.product.update({ where: { id: req.params.id }, data, include }))
  } catch (e) { next(e) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const p = await prisma.product.findUnique({ where: { id: req.params.id } })
    if (!p) throw new NotFoundError('Producto')
    res.json(await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false }, include }))
  } catch (e) { next(e) }
}
