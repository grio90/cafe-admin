import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import prisma from '../../shared/prisma'
import { z } from 'zod'
import { AppError, NotFoundError } from '../../shared/errors'
import { getIO } from '../../shared/socket'

const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
})

const createSchema = z.object({
  tableQrToken: z.string(),
  tenantSlug: z.string(),
  items: z.array(orderItemSchema).min(1, 'Debe incluir al menos un producto'),
  notes: z.string().optional(),
})

const orderInclude = {
  table: { select: { id: true, number: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
  },
}

export async function createPublicOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body)

    const tenant = await prisma.tenant.findUnique({
      where: { slug: data.tenantSlug, isActive: true },
    })
    if (!tenant) throw new NotFoundError('Local')

    const table = await prisma.table.findFirst({
      where: { qrToken: data.tableQrToken, tenantId: tenant.id, isActive: true },
    })
    if (!table) throw new AppError('Mesa no encontrada', 404)

    const products = await prisma.product.findMany({
      where: {
        id: { in: data.items.map((i) => i.productId) },
        tenantId: tenant.id,
        isActive: true,
      },
    })

    if (products.length !== data.items.length) {
      throw new AppError('Uno o más productos no están disponibles', 400)
    }

    const productMap = new Map(products.map((p) => [p.id, p]))
    let total = 0
    const orderItems = data.items.map((item) => {
      const product = productMap.get(item.productId)!
      const unitPrice = parseFloat(product.price.toString())
      const subtotal = unitPrice * item.quantity
      total += subtotal
      return { productId: item.productId, quantity: item.quantity, unitPrice, subtotal, notes: item.notes }
    })

    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        tableId: table.id,
        total,
        notes: data.notes,
        items: { create: orderItems },
      },
      include: orderInclude,
    })

    // Emit real-time event to kitchen and admin
    getIO().to(`tenant:${tenant.id}`).emit('order:new', order)

    res.status(201).json(order)
  } catch (e) { next(e) }
}

export async function getPublicOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: orderInclude,
    })
    if (!order) throw new NotFoundError('Pedido')
    res.json(order)
  } catch (e) { next(e) }
}

export async function list(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant', 400)
    const { status, tableId, date } = req.query

    const where: Record<string, unknown> = { tenantId: req.tenantId }
    if (status) where.status = status
    if (tableId) where.tableId = tableId
    if (date) {
      const d = new Date(date as string)
      where.createdAt = { gte: d, lt: new Date(d.getTime() + 86400000) }
    }

    const orders = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json(orders)
  } catch (e) { next(e) }
}

export async function getById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant', 400)
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      include: orderInclude,
    })
    if (!order) throw new NotFoundError('Pedido')
    res.json(order)
  } catch (e) { next(e) }
}

export async function updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant', 400)
    const { status } = z.object({
      status: z.enum(['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED']),
    }).parse(req.body)

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    })
    if (!order) throw new NotFoundError('Pedido')

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
      include: orderInclude,
    })

    getIO().to(`tenant:${req.tenantId}`).emit('order:updated', updated)

    res.json(updated)
  } catch (e) { next(e) }
}

export async function cancel(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.tenantId) throw new AppError('Sin tenant', 400)
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
    })
    if (!order) throw new NotFoundError('Pedido')

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
      include: orderInclude,
    })

    getIO().to(`tenant:${req.tenantId}`).emit('order:updated', updated)
    res.json(updated)
  } catch (e) { next(e) }
}
