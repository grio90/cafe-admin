export type Role = 'ADMIN' | 'CASHIER'
export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'TRANSFER'
export type RegisterStatus = 'OPEN' | 'CLOSED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  isActive?: boolean
  createdAt?: string
}

export interface Category {
  id: string
  name: string
  color: string
  isActive: boolean
}

export interface Product {
  id: string
  name: string
  description?: string
  price: string
  isActive: boolean
  categoryId: string
  category: { id: string; name: string; color: string }
}

export interface SaleItem {
  id: string
  productId: string
  quantity: number
  unitPrice: string
  subtotal: string
  product: { name: string }
}

export interface Sale {
  id: string
  total: string
  paymentMethod: PaymentMethod
  notes?: string
  createdAt: string
  userId: string
  cashRegisterId?: string
  user: { name: string }
  items: SaleItem[]
}

export interface Expense {
  id: string
  description: string
  amount: string
  notes?: string
  createdAt: string
  userId: string
  cashRegisterId?: string
  user: { name: string }
}

export interface LiveTotals {
  CASH: number
  CREDIT_CARD: number
  DEBIT_CARD: number
  TRANSFER: number
  totalSales: number
  totalExpenses: number
  netCash: number
  transactionCount: number
  [key: string]: number
}

export interface CashRegister {
  id: string
  date: string
  status: RegisterStatus
  openedAt: string
  openingCashAmount: string
  closedAt?: string
  closingNotes?: string
  totalSalesCash?: string
  totalSalesCreditCard?: string
  totalSalesDebitCard?: string
  totalSalesTransfer?: string
  totalSales?: string
  totalExpenses?: string
  netCash?: string
  userId: string
  user?: { name: string }
  liveTotals?: LiveTotals
}

export interface MonthlyReport {
  year: number
  month: number
  monthLabel: string
  totalSales: number
  totalExpenses: number
  CASH: number
  CREDIT_CARD: number
  DEBIT_CARD: number
  TRANSFER: number
  transactionCount: number
}

export interface CartItem {
  product: Product
  quantity: number
}
