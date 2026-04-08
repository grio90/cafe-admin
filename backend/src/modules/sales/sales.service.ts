import { PaymentMethod } from '@prisma/client'
import prisma from '../../shared/prisma'
import { getTodayOpenRegister } from '../cashRegister/cashRegister.service'
import { AppError, NotFoundError } from '../../shared/errors'

interface SaleItem {
  productId: string
  quantity: number
}

export async function createSale(
  userId: string,
  paymentMethod: PaymentMethod,
  items: SaleItem[],
  notes?: string
) {
  const register = await getTodayOpenRegister()

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  })

  if (products.length !== items.length) {
    throw new AppError('Uno o más productos no existen o están inactivos', 400)
  }

  const productMap = new Map(products.map((p) => [p.id, p]))
  let total = 0
  const saleItems = items.map((item) => {
    const product = productMap.get(item.productId)!
    const unitPrice = parseFloat(product.price.toString())
    const subtotal = unitPrice * item.quantity
    total += subtotal
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    }
  })

  return prisma.sale.create({
    data: {
      total,
      paymentMethod,
      notes,
      userId,
      cashRegisterId: register.id,
      items: { create: saleItems },
    },
    include: {
      items: { include: { product: { select: { name: true } } } },
      user: { select: { name: true } },
    },
  })
}

export async function listSales(filters: { from?: string; to?: string; paymentMethod?: string; cashRegisterId?: string }) {
  const where: Record<string, unknown> = {}
  if (filters.from || filters.to) {
    where.createdAt = {}
    if (filters.from) (where.createdAt as Record<string, Date>).gte = new Date(filters.from)
    if (filters.to) {
      const to = new Date(filters.to)
      to.setHours(23, 59, 59, 999)
      ;(where.createdAt as Record<string, Date>).lte = to
    }
  }
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod
  if (filters.cashRegisterId) where.cashRegisterId = filters.cashRegisterId

  return prisma.sale.findMany({
    where,
    include: {
      items: { include: { product: { select: { name: true } } } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getSaleById(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, category: { select: { name: true } } } } } },
      user: { select: { name: true } },
    },
  })
  if (!sale) throw new NotFoundError('Venta')
  return sale
}

export async function voidSale(id: string) {
  const sale = await prisma.sale.findUnique({ where: { id }, include: { cashRegister: true } })
  if (!sale) throw new NotFoundError('Venta')
  if (sale.cashRegister?.status === 'CLOSED') {
    throw new AppError('No se puede anular una venta de una caja cerrada', 400)
  }
  return prisma.sale.delete({ where: { id } })
}
