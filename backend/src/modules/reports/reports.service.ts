import prisma from '../../shared/prisma'

export async function getMonthlyReport() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({
      where: { createdAt: { gte: from } },
      select: { total: true, paymentMethod: true, createdAt: true },
    }),
    prisma.expense.findMany({
      where: { createdAt: { gte: from } },
      select: { amount: true, createdAt: true },
    }),
  ])

  const months: Record<string, {
    year: number; month: number; monthLabel: string
    totalSales: number; totalExpenses: number
    CASH: number; CREDIT_CARD: number; DEBIT_CARD: number; TRANSFER: number; MERCADO_PAGO: number
    transactionCount: number
  }> = {}

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months[key] = {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      monthLabel: d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
      totalSales: 0, totalExpenses: 0,
      CASH: 0, CREDIT_CARD: 0, DEBIT_CARD: 0, TRANSFER: 0, MERCADO_PAGO: 0,
      transactionCount: 0,
    }
  }

  for (const s of sales) {
    const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, '0')}`
    if (months[key]) {
      const amount = parseFloat(s.total.toString())
      months[key].totalSales += amount
      months[key][s.paymentMethod] += amount
      months[key].transactionCount++
    }
  }

  for (const e of expenses) {
    const key = `${e.createdAt.getFullYear()}-${String(e.createdAt.getMonth() + 1).padStart(2, '0')}`
    if (months[key]) months[key].totalExpenses += parseFloat(e.amount.toString())
  }

  return Object.values(months)
}

export async function getPaymentMethodBreakdown(from?: string, to?: string) {
  const where: Record<string, unknown> = {}
  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Record<string, Date>).gte = new Date(from)
    if (to) {
      const d = new Date(to); d.setHours(23, 59, 59, 999)
      ;(where.createdAt as Record<string, Date>).lte = d
    }
  }

  const sales = await prisma.sale.findMany({ where, select: { total: true, paymentMethod: true } })
  const result = { CASH: 0, CREDIT_CARD: 0, DEBIT_CARD: 0, TRANSFER: 0, MERCADO_PAGO: 0, total: 0 }
  for (const s of sales) {
    const amount = parseFloat(s.total.toString())
    result[s.paymentMethod] += amount
    result.total += amount
  }
  return result
}

export async function getTopProducts(from?: string, to?: string) {
  const where: Record<string, unknown> = {}
  if (from || to) {
    where.sale = { createdAt: {} }
    if (from) (where.sale as Record<string, Record<string, Date>>).createdAt.gte = new Date(from)
    if (to) {
      const d = new Date(to); d.setHours(23, 59, 59, 999)
      ;(where.sale as Record<string, Record<string, Date>>).createdAt.lte = d
    }
  }

  const items = await prisma.saleItem.groupBy({
    by: ['productId'],
    where,
    _sum: { subtotal: true, quantity: true },
    orderBy: { _sum: { subtotal: 'desc' } },
    take: 10,
  })

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, name: true, category: { select: { name: true } } },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  return items.map((i) => ({
    product: productMap.get(i.productId),
    totalRevenue: parseFloat((i._sum.subtotal ?? 0).toString()),
    totalQuantity: i._sum.quantity ?? 0,
  }))
}

export async function getDailyReport(year: number, month: number) {
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0, 23, 59, 59, 999)

  const registers = await prisma.cashRegister.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: 'asc' },
  })

  return registers
}
