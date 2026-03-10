import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method
  const query = getQuery(event)

  // GET — list orders
  if (method === 'GET') {
    const where: any = {}
    if (query.status) where.status = query.status
    if (query.date) {
      const d = new Date(query.date as string)
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const end = new Date(start.getTime() + 86400000)
      where.createdAt = { gte: start, lt: end }
    }

    return prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        cashier: { select: { id: true, name: true } },
      },
      take: Number(query.limit) || 50,
    })
  }

  // POST — create order
  if (method === 'POST') {
    const body = await readBody(event)

    if (!body.items || !body.items.length) {
      throw createError({ statusCode: 400, statusMessage: 'Order harus memiliki minimal 1 item' })
    }

    // Get session user as cashier
    const sessionCookie = getCookie(event, 'mm_session')
    if (!sessionCookie) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    // Generate order number: ORD-YYYYMMDD-XXXX
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const countToday = await prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        },
      },
    })
    const orderNumber = `ORD-${dateStr}-${String(countToday + 1).padStart(4, '0')}`

    // Fetch product prices
    const productIds = body.items.map((i: any) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    })
    const productMap = new Map(products.map((p: any) => [p.id, p]))

    // Calculate items
    const items = body.items.map((item: any) => {
      const product = productMap.get(item.productId)
      if (!product) throw createError({ statusCode: 400, statusMessage: `Produk ${item.productId} tidak ditemukan` })
      const unitPrice = Number(product.price)
      const quantity = Number(item.quantity)
      return {
        productId: item.productId,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
        notes: item.notes || null,
      }
    })

    const subtotal = items.reduce((sum: number, i: any) => sum + i.subtotal, 0)
    const discountAmount = Number(body.discountAmount) || 0
    const taxAmount = Number(body.taxAmount) || 0
    const totalAmount = subtotal - discountAmount + taxAmount

    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType: body.orderType || 'DINE_IN',
        tableNumber: body.tableNumber || null,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        notes: body.notes || null,
        customerName: body.customerName || null,
        cashierId: sessionCookie,
        items: { create: items },
      },
      include: {
        items: { include: { product: true } },
        cashier: { select: { id: true, name: true } },
      },
    })

    // Decrease stock for tracked products
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (product && product.trackStock) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }
    }

    return order
  }
})
