import { Request, Response, NextFunction } from 'express'
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import prisma from '../../shared/prisma'
import { AppError, NotFoundError } from '../../shared/errors'
import { getIO } from '../../shared/socket'
import { z } from 'zod'

const createSchema = z.object({
  orderId: z.string(),
})

function getMPClient(accessToken: string) {
  return new MercadoPagoConfig({ accessToken })
}

export async function createPreference(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = createSchema.parse(req.body)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: { select: { mpAccessToken: true, slug: true, name: true } },
        items: { include: { product: { select: { name: true } } } },
        table: { select: { number: true } },
      },
    })
    if (!order) throw new NotFoundError('Pedido')
    if (!order.tenant.mpAccessToken) throw new AppError('El local no tiene Mercado Pago configurado', 400)
    if (order.paymentStatus === 'PAID') throw new AppError('El pedido ya fue pagado', 400)

    const client = getMPClient(order.tenant.mpAccessToken)
    const preference = new Preference(client)

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

    const result = await preference.create({
      body: {
        items: order.items.map((item) => ({
          id: item.productId,
          title: item.product.name,
          quantity: item.quantity,
          unit_price: parseFloat(item.unitPrice.toString()),
          currency_id: 'ARS',
        })),
        external_reference: orderId,
        notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/v1/payments/webhook`,
        back_urls: {
          success: `${frontendUrl}/menu/${order.tenant.slug}/order/${orderId}/success`,
          failure: `${frontendUrl}/menu/${order.tenant.slug}/order/${orderId}/failure`,
          pending: `${frontendUrl}/menu/${order.tenant.slug}/order/${orderId}/pending`,
        },
        auto_return: 'approved',
        metadata: { orderId, tenantId: order.tenantId },
      },
    })

    await prisma.order.update({
      where: { id: orderId },
      data: { mpPreferenceId: result.id, paymentStatus: 'PROCESSING' },
    })

    res.json({ preferenceId: result.id, initPoint: result.init_point })
  } catch (e) { next(e) }
}

export async function webhook(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, data } = req.body

    if (type !== 'payment' || !data?.id) {
      return res.sendStatus(200)
    }

    // Find the order this payment belongs to
    const order = await prisma.order.findFirst({
      where: { mpPreferenceId: { not: null } },
      include: { tenant: { select: { mpAccessToken: true } } },
    })

    if (!order?.tenant.mpAccessToken) return res.sendStatus(200)

    const client = getMPClient(order.tenant.mpAccessToken)
    const paymentAPI = new Payment(client)
    const payment = await paymentAPI.get({ id: data.id })

    const orderId = payment.external_reference
    if (!orderId) return res.sendStatus(200)

    const targetOrder = await prisma.order.findUnique({ where: { id: orderId } })
    if (!targetOrder) return res.sendStatus(200)

    let paymentStatus: 'PAID' | 'FAILED' | 'PROCESSING' = 'PROCESSING'
    let orderStatus = targetOrder.status

    if (payment.status === 'approved') {
      paymentStatus = 'PAID'
      orderStatus = 'CONFIRMED'
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      paymentStatus = 'FAILED'
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus,
        status: orderStatus,
        mpPaymentId: String(data.id),
      },
      include: {
        table: { select: { id: true, number: true } },
        items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
      },
    })

    if (paymentStatus === 'PAID') {
      getIO().to(`tenant:${targetOrder.tenantId}`).emit('order:paid', updated)
    }

    res.sendStatus(200)
  } catch (e) { next(e) }
}
