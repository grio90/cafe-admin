import { Request, Response, NextFunction } from 'express'
import { AppError } from '../shared/errors'
import { ZodError } from 'zod'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos inválidos',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor' })
}
