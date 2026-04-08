import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const cashierPassword = await bcrypt.hash('cajero123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@cafe.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@cafe.com',
      passwordHash: adminPassword,
      role: Role.ADMIN,
    },
  })

  const cashier = await prisma.user.upsert({
    where: { email: 'cajero@cafe.com' },
    update: {},
    create: {
      name: 'Cajero',
      email: 'cajero@cafe.com',
      passwordHash: cashierPassword,
      role: Role.CASHIER,
    },
  })

  const cafes = await prisma.category.upsert({
    where: { name: 'Cafés' },
    update: {},
    create: { name: 'Cafés', color: '#92400E' },
  })

  const medialunas = await prisma.category.upsert({
    where: { name: 'Panadería' },
    update: {},
    create: { name: 'Panadería', color: '#D97706' },
  })

  const bebidas = await prisma.category.upsert({
    where: { name: 'Bebidas' },
    update: {},
    create: { name: 'Bebidas', color: '#0369A1' },
  })

  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Espresso', price: 1800, categoryId: cafes.id },
      { name: 'Café con leche', price: 2200, categoryId: cafes.id },
      { name: 'Cappuccino', price: 2500, categoryId: cafes.id },
      { name: 'Latte', price: 2700, categoryId: cafes.id },
      { name: 'Medialunas x3', price: 1500, categoryId: medialunas.id },
      { name: 'Tostado jamón y queso', price: 3200, categoryId: medialunas.id },
      { name: 'Agua mineral', price: 1200, categoryId: bebidas.id },
      { name: 'Jugo de naranja', price: 2800, categoryId: bebidas.id },
    ],
  })

  console.log('✅ Seed completado')
  console.log('Admin: admin@cafe.com / admin123')
  console.log('Cajero: cajero@cafe.com / cajero123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
