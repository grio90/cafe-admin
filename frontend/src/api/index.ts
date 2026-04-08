import client from './client'
import type { PaymentMethod } from '@/types'

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    client.post('/auth/login', { email, password }).then((r) => r.data),
  me: () => client.get('/auth/me').then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    client.patch('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),
}

// Users
export const usersApi = {
  list: () => client.get('/users').then((r) => r.data),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    client.post('/users', data).then((r) => r.data),
  update: (id: string, data: object) => client.patch(`/users/${id}`, data).then((r) => r.data),
  resetPassword: (id: string, password: string) =>
    client.patch(`/users/${id}/reset-password`, { password }).then((r) => r.data),
  remove: (id: string) => client.delete(`/users/${id}`).then((r) => r.data),
}

// Categories
export const categoriesApi = {
  list: () => client.get('/categories').then((r) => r.data),
  create: (data: { name: string; color?: string }) => client.post('/categories', data).then((r) => r.data),
  update: (id: string, data: object) => client.patch(`/categories/${id}`, data).then((r) => r.data),
  remove: (id: string) => client.delete(`/categories/${id}`).then((r) => r.data),
}

// Products
export const productsApi = {
  list: (active = true) => client.get(`/products?active=${active}`).then((r) => r.data),
  create: (data: object) => client.post('/products', data).then((r) => r.data),
  update: (id: string, data: object) => client.patch(`/products/${id}`, data).then((r) => r.data),
  remove: (id: string) => client.delete(`/products/${id}`).then((r) => r.data),
}

// Sales
export const salesApi = {
  list: (params?: object) => client.get('/sales', { params }).then((r) => r.data),
  create: (data: { paymentMethod: PaymentMethod; notes?: string; items: { productId: string; quantity: number }[] }) =>
    client.post('/sales', data).then((r) => r.data),
  getById: (id: string) => client.get(`/sales/${id}`).then((r) => r.data),
  void: (id: string) => client.delete(`/sales/${id}`).then((r) => r.data),
}

// Expenses
export const expensesApi = {
  list: (params?: object) => client.get('/expenses', { params }).then((r) => r.data),
  create: (data: { description: string; amount: number; notes?: string }) =>
    client.post('/expenses', data).then((r) => r.data),
  remove: (id: string) => client.delete(`/expenses/${id}`).then((r) => r.data),
}

// Cash Register
export const cashRegisterApi = {
  list: (params?: object) => client.get('/cash-register', { params }).then((r) => r.data),
  today: () => client.get('/cash-register/today').then((r) => r.data),
  open: (openingCashAmount: number) =>
    client.post('/cash-register/open', { openingCashAmount }).then((r) => r.data),
  getById: (id: string) => client.get(`/cash-register/${id}`).then((r) => r.data),
  summary: (id: string) => client.get(`/cash-register/${id}/summary`).then((r) => r.data),
  close: (id: string, closingNotes?: string) =>
    client.post(`/cash-register/${id}/close`, { closingNotes }).then((r) => r.data),
}

// Reports
export const reportsApi = {
  monthly: () => client.get('/reports/monthly').then((r) => r.data),
  paymentMethods: (params?: object) => client.get('/reports/payment-methods', { params }).then((r) => r.data),
  topProducts: (params?: object) => client.get('/reports/top-products', { params }).then((r) => r.data),
  daily: (year: number, month: number) =>
    client.get('/reports/daily', { params: { year, month } }).then((r) => r.data),
}
