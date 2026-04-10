import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'

import { errorHandler } from './middleware/error.middleware'
import authRouter from './modules/auth/auth.router'
import usersRouter from './modules/users/users.router'
import categoriesRouter from './modules/categories/categories.router'
import productsRouter from './modules/products/products.router'
import salesRouter from './modules/sales/sales.router'
import expensesRouter from './modules/expenses/expenses.router'
import cashRegisterRouter from './modules/cashRegister/cashRegister.router'
import reportsRouter from './modules/reports/reports.router'
import tenantsRouter from './modules/tenants/tenants.router'
import tablesRouter from './modules/tables/tables.router'
import menuRouter from './modules/menu/menu.router'
import ordersRouter from './modules/orders/orders.router'
import paymentsRouter from './modules/payments/payments.router'

const app = express()

app.set('trust proxy', 1)
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }))

// Existing routes
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/categories', categoriesRouter)
app.use('/api/v1/products', productsRouter)
app.use('/api/v1/sales', salesRouter)
app.use('/api/v1/expenses', expensesRouter)
app.use('/api/v1/cash-register', cashRegisterRouter)
app.use('/api/v1/reports', reportsRouter)

// New QR ordering routes
app.use('/api/v1/tenants', tenantsRouter)
app.use('/api/v1/tables', tablesRouter)
app.use('/api/v1/menu', menuRouter)
app.use('/api/v1/orders', ordersRouter)
app.use('/api/v1/payments', paymentsRouter)

app.use(errorHandler)

export default app
