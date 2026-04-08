import { Request, Response, NextFunction } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import * as service from './auth.service'
import { loginSchema, changePasswordSchema } from './auth.schema'

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body)
    const result = await service.login(data.email, data.password)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function me(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await service.getMe(req.userId!)
    res.json(user)
  } catch (err) {
    next(err)
  }
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = changePasswordSchema.parse(req.body)
    await service.changePassword(req.userId!, data.currentPassword, data.newPassword)
    res.json({ message: 'Contraseña actualizada' })
  } catch (err) {
    next(err)
  }
}
