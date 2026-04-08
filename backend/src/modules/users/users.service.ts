import bcrypt from 'bcryptjs'
import { Role } from '@prisma/client'
import prisma from '../../shared/prisma'
import { AppError, NotFoundError } from '../../shared/errors'

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })
}

export async function createUser(data: { name: string; email: string; password: string; role: Role }) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new AppError('El email ya está registrado', 409)

  const passwordHash = await bcrypt.hash(data.password, 10)
  return prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role: data.role },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  })
}

export async function updateUser(id: string, data: { name?: string; role?: Role; isActive?: boolean }) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new NotFoundError('Usuario')
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })
}

export async function resetPassword(id: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new NotFoundError('Usuario')
  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id }, data: { passwordHash } })
}

export async function removeUser(id: string, requesterId: string) {
  if (id === requesterId) throw new AppError('No podés desactivar tu propio usuario', 400)
  return updateUser(id, { isActive: false })
}
