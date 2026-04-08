import { Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import * as service from './users.service'
import { z } from 'zod'
import { Role } from '@prisma/client'

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role).default(Role.CASHIER),
})

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
})

export async function list(_req: AuthRequest, res: Response, next: NextFunction) {
  try { res.json(await service.listUsers()) } catch (e) { next(e) }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body)
    res.status(201).json(await service.createUser(data))
  } catch (e) { next(e) }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = updateSchema.parse(req.body)
    res.json(await service.updateUser(req.params.id, data))
  } catch (e) { next(e) }
}

export async function resetPassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { password } = z.object({ password: z.string().min(6) }).parse(req.body)
    await service.resetPassword(req.params.id, password)
    res.json({ message: 'Contraseña restablecida' })
  } catch (e) { next(e) }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    res.json(await service.removeUser(req.params.id, req.userId!))
  } catch (e) { next(e) }
}
