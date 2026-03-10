import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const method = event.method

  // GET — single order
  if (method === 'GET') {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        cashier: { select: { id: true, name: true } },
      },
    })
    if (!order) throw createError({ statusCode: 404, statusMessage: 'Order tidak ditemukan' })
    return order
  }

  // PUT — update order (pay / cancel)
  if (method === 'PUT') {
    const body = await readBody(event)

    const existing = await prisma.order.findUnique({ where: { id } })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'Order tidak ditemukan' })

    // Payment
    if (body.action === 'pay') {
      if (existing.status !== 'PENDING') {
        throw createError({ statusCode: 400, statusMessage: 'Order sudah diproses' })
      }
      const paidAmount = Number(body.paidAmount)
      const totalAmount = Number(existing.totalAmount)
      if (paidAmount < totalAmount) {
        throw createError({ statusCode: 400, statusMessage: 'Jumlah bayar kurang' })
      }
      return prisma.order.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          paymentMethod: body.paymentMethod || 'CASH',
          paidAmount,
          changeAmount: paidAmount - totalAmount,
          paidAt: new Date(),
        },
        include: {
          items: { include: { product: true } },
          cashier: { select: { id: true, name: true } },
        },
      })
    }

    // Cancel
    if (body.action === 'cancel') {
      if (existing.status !== 'PENDING') {
        throw createError({ statusCode: 400, statusMessage: 'Hanya order pending yang bisa dibatalkan' })
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

      return prisma.order.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: {
          items: { include: { product: true } },
          cashier: { select: { id: true, name: true } },
        },
      })
    }

    throw createError({ statusCode: 400, statusMessage: 'Action tidak valid' })
  }
})
