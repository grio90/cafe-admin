import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../shared/jwt'
import { UnauthorizedError, ForbiddenError } from '../shared/errors'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token requerido'))
  }
  try {
    const payload = verifyToken(header.slice(7))
    req.userId = payload.userId
    req.userRole = payload.role
    next()
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'))
  }
}

export function requireAdmin(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.userRole !== 'ADMIN') {
    return next(new ForbiddenError('Solo administradores pueden realizar esta acción'))
  }
  next()
}
