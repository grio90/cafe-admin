import { RegisterStatus } from '@prisma/client'
import prisma from '../../shared/prisma'
import { AppError, NotFoundError } from '../../shared/errors'

export async function getTodayRegister() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return prisma.cashRegister.findUnique({ where: { date: today } })
}

export async function getTodayOpenRegister() {
  const reg = await getTodayRegister()
  if (!reg || reg.status !== RegisterStatus.OPEN) {
    throw new AppError('No hay una caja abierta para hoy. Abrí la caja primero.', 400)
  }
  return reg
}

export async function computeLiveTotals(registerId: string) {
  const [sales, expenses] = await Promise.all([
    prisma.sale.findMany({ where: { cashRegisterId: registerId }, select: { total: true, paymentMethod: true } }),
    prisma.expense.findMany({ where: { cashRegisterId: registerId }, select: { amount: true } }),
  ])

  const totals = {
    CASH: 0, CREDIT_CARD: 0, DEBIT_CARD: 0, TRANSFER: 0,
    totalSales: 0, totalExpenses: 0, netCash: 0, transactionCount: sales.length,
  }

  for (const s of sales) {
    const amount = parseFloat(s.total.toString())
    totals[s.paymentMethod] += amount
    totals.totalSales += amount
  }
  for (const e of expenses) {
    totals.totalExpenses += parseFloat(e.amount.toString())
  }

  return totals
}

export async function openRegister(userId: string, openingCashAmount: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.cashRegister.findUnique({ where: { date: today } })
  if (existing) throw new AppError('Ya existe una caja para hoy', 409)

  return prisma.cashRegister.create({
    data: { date: today, openingCashAmount, userId },
  })
}

export async function getRegisterWithLiveTotals(id: string) {
  const reg = await prisma.cashRegister.findUnique({ where: { id } })
  if (!reg) throw new NotFoundError('Caja')
  if (reg.status === RegisterStatus.OPEN) {
    const liveTotals = await computeLiveTotals(id)
    return { ...reg, liveTotals }
  }
  return reg
}

export async function closeRegister(id: string, userId: string, closingNotes?: string) {
  const reg = await prisma.cashRegister.findUnique({ where: { id } })
  if (!reg) throw new NotFoundError('Caja')
  if (reg.status === RegisterStatus.CLOSED) throw new AppError('La caja ya está cerrada', 400)

  const totals = await computeLiveTotals(id)
  const netCash = parseFloat(reg.openingCashAmount.toString()) + totals.CASH - totals.totalExpenses

  return prisma.cashRegister.update({
    where: { id },
    data: {
      status: RegisterStatus.CLOSED,
      closedAt: new Date(),
      closingNotes,
      totalSalesCash: totals.CASH,
      totalSalesCreditCard: totals.CREDIT_CARD,
      totalSalesDebitCard: totals.DEBIT_CARD,
      totalSalesTransfer: totals.TRANSFER,
      totalSales: totals.totalSales,
      totalExpenses: totals.totalExpenses,
      netCash,
    },
  })
}

export async function listRegisters(from?: string, to?: string) {
  const where: Record<string, unknown> = {}
  if (from || to) {
    where.date = {}
    if (from) (where.date as Record<string, Date>).gte = new Date(from)
    if (to) (where.date as Record<string, Date>).lte = new Date(to)
  }
  return prisma.cashRegister.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { date: 'desc' },
  })
}
