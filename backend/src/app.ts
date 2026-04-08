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

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/categories', categoriesRouter)
app.use('/api/v1/products', productsRouter)
app.use('/api/v1/sales', salesRouter)
app.use('/api/v1/expenses', expensesRouter)
app.use('/api/v1/cash-register', cashRegisterRouter)
app.use('/api/v1/reports', reportsRouter)

app.use(errorHandler)

export default app
