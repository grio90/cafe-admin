import bcrypt from 'bcryptjs'
import prisma from '../../shared/prisma'
import { signToken } from '../../shared/jwt'
import { AppError, NotFoundError, UnauthorizedError } from '../../shared/errors'

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) throw new UnauthorizedError('Credenciales inválidas')

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) throw new UnauthorizedError('Credenciales inválidas')

  const token = signToken({ userId: user.id, role: user.role })
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true },
  })
  if (!user) throw new NotFoundError('Usuario')
  return user
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new NotFoundError('Usuario')

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) throw new AppError('Contraseña actual incorrecta', 400)

  const hash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } })
}
