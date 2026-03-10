import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const id = getRouterParam(event, 'id')!
  const method = event.method

  // GET — single order
  if (method === 'GET') {
    const order = await prisma.order.findFirst({
      where: { id, locationId: session.locationId },
      include: {
        items: { include: { product: true } },
        cashier: { select: { id: true, name: true } },
        splitBills: { include: { items: { include: { orderItem: { include: { product: true } } } } } },
        tableTransfers: { orderBy: { transferredAt: 'desc' } },
      },
    })
    if (!order) throwError('ORD_NOT_FOUND')
    return order
  }

  // PUT — update order (pay / cancel)
  if (method === 'PUT') {
    const body = await readBody(event)

    const existing = await prisma.order.findFirst({
      where: { id, locationId: session.locationId },
    })
    if (!existing) throwError('ORD_NOT_FOUND')

    // Payment
    if (body.action === 'pay') {
      await requirePermission(event, 'pos.pay_order')

      if (existing.status !== 'PENDING') {
        throwError('ORD_ALREADY_PROCESSED')
      }
      const paidAmount = Number(body.paidAmount)
      const totalAmount = Number(existing.totalAmount)
      if (body.paymentMethod === 'CASH' && paidAmount < totalAmount) {
        throwError('ORD_INSUFFICIENT_PAYMENT')
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          paymentMethod: body.paymentMethod || 'CASH',
          paidAmount,
          changeAmount: paidAmount - totalAmount > 0 ? paidAmount - totalAmount : 0,
          paidAt: new Date(),
        },
        include: {
          items: { include: { product: true } },
          cashier: { select: { id: true, name: true } },
        },
      })

      await logger.info(event, 'pos', 'ORDER_PAID', `Order ${existing.orderNumber} dibayar (${body.paymentMethod})`, {
        userId: session.userId,
        locationId: session.locationId,
        metadata: { orderId: id, paymentMethod: body.paymentMethod, paidAmount, totalAmount },
      })

      return updated
    }

    // Cancel
    if (body.action === 'cancel') {
      await requirePermission(event, 'pos.cancel_order')

      if (existing.status !== 'PENDING') {
        throwError('ORD_ONLY_PENDING')
      }

      // Restore stock
      const items = await prisma.orderItem.findMany({
        where: { orderId: id },
        include: { product: true },
      })
      for (const item of items) {
        if (item.product.trackStock) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }
      }

      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          items: { include: { product: true } },
          cashier: { select: { id: true, name: true } },
        },
      })

      await logger.info(event, 'pos', 'ORDER_CANCELLED', `Order ${existing.orderNumber} dibatalkan`, {
        userId: session.userId,
        locationId: session.locationId,
        metadata: { orderId: id },
      })

      return updated
    }

    // Reopen (Admin only)
    if (body.action === 'reopen') {
      await requireRole(event, 'ADMIN')

      if (existing.status === 'PENDING') {
        throwError('ORD_ALREADY_PENDING')
      }

      const updated = await prisma.order.update({
        where: { id },
        data: {
          status: 'PENDING',
          paymentMethod: null,
          paidAmount: null,
          changeAmount: null,
          paidAt: null,
        },
        include: {
          items: { include: { product: true } },
          cashier: { select: { id: true, name: true } },
        },
      })

      await logger.info(event, 'pos', 'ORDER_REOPENED', `Order ${existing.orderNumber} dibuka kembali oleh admin`, {
        userId: session.userId,
        locationId: session.locationId,
        metadata: { orderId: id, previousStatus: existing.status },
      })

      return updated
    }

    throwError('ORD_INVALID_ACTION')
  }
})
