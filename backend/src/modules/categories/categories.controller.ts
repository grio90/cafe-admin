import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import prisma from '../../shared/prisma'
import { z } from 'zod'
import { NotFoundError, AppError } from '../../shared/errors'

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hex inválido').optional(),
})

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(await prisma.category.findMany({ where: { isActive: true, tenantId: req.tenantId! }, orderBy: { name: 'asc' } }))
  } catch (e) { next(e) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = schema.parse(req.body)
    res.status(201).json(await prisma.category.create({ data: { ...data, tenantId: req.tenantId! } }))
  } catch (e) { next(e) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = schema.partial().parse(req.body)
    const cat = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!cat) throw new NotFoundError('Categoría')
    res.json(await prisma.category.update({ where: { id: req.params.id }, data }))
  } catch (e) { next(e) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const cat = await prisma.category.findUnique({ where: { id: req.params.id } })
    if (!cat) throw new NotFoundError('Categoría')
    const count = await prisma.product.count({ where: { categoryId: req.params.id, isActive: true } })
    if (count > 0) throw new AppError('No se puede eliminar una categoría con productos activos', 400)
    res.json(await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } }))
  } catch (e) { next(e) }
}
