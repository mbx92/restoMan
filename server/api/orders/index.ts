import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const method = event.method
  const query = getQuery(event)

  // GET — list orders
  if (method === 'GET') {
    const where: any = { locationId: session.locationId }
    if (query.status) where.status = query.status
    if (query.shiftId) where.shiftId = query.shiftId
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
        splitBills: true,
      },
      take: Number(query.limit) || 50,
    })
  }

  // POST — create order
  if (method === 'POST') {
    await requirePermission(event, 'pos.create_order')
    const body = await readBody(event)

    if (!body.items || !body.items.length) {
      throwError('ORD_EMPTY_ITEMS')
    }

    // Shift check — must have an open shift
    const openShift = await prisma.cashRegisterShift.findFirst({
      where: {
        locationId: session.locationId,
        userId: session.userId,
        status: 'OPEN',
      },
    })
    if (!openShift) {
      throwError('SFT_NOT_OPEN')
    }

    // Order type validation based on settings
    const orderMode = await getSetting(session.locationId, 'order.mode')
    const requestedType = body.orderType || 'DINE_IN'

    if (orderMode === 'dine_in_only' && requestedType !== 'DINE_IN') {
      throwError('ORD_TYPE_NOT_ALLOWED')
    }
    if (orderMode === 'takeaway_only' && requestedType !== 'TAKEAWAY') {
      throwError('ORD_TYPE_NOT_ALLOWED')
    }

    // Table required check
    if (requestedType === 'DINE_IN') {
      const requireTable = await getSettingBool(session.locationId, 'order.requireTable')
      if (requireTable && !body.tableNumber) {
        throwError('ORD_TABLE_REQUIRED')
      }
    }

    // Generate order number with prefix from settings
    const prefix = await getSetting(session.locationId, 'prefix.order')
    const orderNumber = await nextSequence(session.locationId, prefix || 'ORD')

    // Fetch product prices
    const productIds = body.items.map((i: any) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, tenantId: session.tenantId },
    })
    const productMap = new Map(products.map((p: any) => [p.id, p]))

    // Calculate items
    const items = body.items.map((item: any) => {
      const product = productMap.get(item.productId)
      if (!product) throwError('ORD_PRODUCT_NOT_FOUND', item.productId)
      
      let unitPrice = Number(product.price)
      const quantity = Number(item.quantity)
      
      // Calculate additional prices from variants
      if (item.variantSelections && Array.isArray(item.variantSelections)) {
        item.variantSelections.forEach((sel: any) => {
          unitPrice += Number(sel.additionalPrice) || 0
        })
      }

      return {
        productId: item.productId,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
        notes: item.notes || null,
        variantSelections: item.variantSelections || null
      }
    })

    const subtotal = items.reduce((sum: number, i: any) => sum + i.subtotal, 0)
    const discountAmount = Number(body.discountAmount) || 0
    const afterDiscount = subtotal - discountAmount

    // Calculate tax & service charge from settings
    const charges = await calculateCharges(session.locationId, afterDiscount)

    const order = await prisma.order.create({
      data: {
        orderNumber,
        orderType: requestedType,
        tableNumber: body.tableNumber || null,
        subtotal,
        discountAmount,
        taxAmount: charges.taxAmount,
        serviceCharge: charges.serviceCharge,
        totalAmount: charges.totalAmount,
        notes: body.notes || null,
        customerName: body.customerName || null,
        customerCount: body.customerCount ? Number(body.customerCount) : null,
        cashierId: session.userId,
        locationId: session.locationId,
        shiftId: openShift.id,
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

    await logger.info(event, 'pos', 'ORDER_CREATED', `Order ${orderNumber} dibuat`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { orderId: order.id, orderNumber, total: charges.totalAmount },
    })

    return order
  }
})
