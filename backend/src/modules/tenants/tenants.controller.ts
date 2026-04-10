import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import prisma from '../../shared/prisma'
import { z } from 'zod'
import { AppError, NotFoundError } from '../../shared/errors'
import bcrypt from 'bcryptjs'

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  address: z.string().optional(),
  phone: z.string().optional(),
  primaryColor: z.string().optional(),
  plan: z.enum(['FREE', 'STARTER', 'PRO']).optional(),
  // First admin user
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
})

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  primaryColor: z.string().optional(),
  plan: z.enum(['FREE', 'STARTER', 'PRO']).optional(),
  isActive: z.boolean().optional(),
  mpAccessToken: z.string().optional(),
})

export async function list(_req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenants = await prisma.tenant.findMany({
      include: { _count: { select: { users: true, tables: true, orders: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(tenants)
  } catch (e) { next(e) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body)

    const existing = await prisma.tenant.findUnique({ where: { slug: data.slug } })
    if (existing) throw new AppError('El slug ya está en uso', 400)

    const emailInUse = await prisma.user.findUnique({ where: { email: data.adminEmail } })
    if (emailInUse) throw new AppError('El email ya está registrado', 400)

    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          name: data.name,
          slug: data.slug,
          address: data.address,
          phone: data.phone,
          primaryColor: data.primaryColor ?? '#0a1628',
          plan: data.plan ?? 'FREE',
        },
      })
      await tx.user.create({
        data: {
          name: data.adminName,
          email: data.adminEmail,
          passwordHash: await bcrypt.hash(data.adminPassword, 10),
          role: 'ADMIN',
          tenantId: t.id,
        },
      })
      return t
    })

    res.status(201).json(tenant)
  } catch (e) { next(e) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body)
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) throw new NotFoundError('Local')
    res.json(await prisma.tenant.update({ where: { id: req.params.id }, data }))
  } catch (e) { next(e) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: req.params.id } })
    if (!tenant) throw new NotFoundError('Local')
    await prisma.tenant.update({ where: { id: req.params.id }, data: { isActive: false } })
    res.json({ ok: true })
  } catch (e) { next(e) }
}

export async function getMyTenant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant asignado', 400)
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.tenantId },
      include: { _count: { select: { tables: true, orders: true, products: true } } },
    })
    if (!tenant) throw new NotFoundError('Local')
    res.json(tenant)
  } catch (e) { next(e) }
}

export async function updateMyTenant(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant asignado', 400)
    const data = updateSchema.parse(req.body)
    // Admin can't change plan or isActive
    const { plan: _, isActive: __, ...allowedData } = data
    res.json(await prisma.tenant.update({ where: { id: req.tenantId }, data: allowedData }))
  } catch (e) { next(e) }
}
