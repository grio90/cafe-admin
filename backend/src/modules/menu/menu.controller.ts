import { Request, Response, NextFunction } from 'express'
import prisma from '../../shared/prisma'
import { NotFoundError, AppError } from '../../shared/errors'

export async function getMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: req.params.slug, isActive: true },
      select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
    })
    if (!tenant) throw new NotFoundError('Local')

    const categories = await prisma.category.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: {
        products: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, description: true, price: true, imageUrl: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    res.json({ tenant, categories })
  } catch (e) { next(e) }
}

export async function getTableMenu(req: Request, res: Response, next: NextFunction) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: req.params.slug, isActive: true },
      select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
    })
    if (!tenant) throw new NotFoundError('Local')

    const table = await prisma.table.findFirst({
      where: { qrToken: req.params.qrToken, tenantId: tenant.id, isActive: true },
      select: { id: true, number: true, qrToken: true },
    })
    if (!table) throw new AppError('Mesa no encontrada o inactiva', 404)

    const categories = await prisma.category.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: {
        products: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true, description: true, price: true, imageUrl: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    res.json({ tenant, table, categories })
  } catch (e) { next(e) }
}
