import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  await requirePermission(event, 'pos.move_items')

  const orderId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const { targetOrderId, items } = body
  // items: [{ orderItemId, quantity }]

  if (!targetOrderId || !Array.isArray(items) || !items.length) {
    throwError('ORD_EMPTY_ITEMS')
  }

  const sourceOrder = await prisma.order.findFirst({
    where: { id: orderId, locationId: session.locationId },
    include: { items: true },
  })
  if (!sourceOrder) throwError('ORD_NOT_FOUND')
  if (sourceOrder.status !== 'PENDING') throwError('ORD_ONLY_PENDING')

  const targetOrder = await prisma.order.findFirst({
    where: { id: targetOrderId, locationId: session.locationId },
    include: { items: true },
  })
  if (!targetOrder) throwError('ORD_NOT_FOUND', 'Order tujuan')
  if (targetOrder.status !== 'PENDING') throwError('ORD_ONLY_PENDING')

  // Move items
  for (const moveItem of items) {
    const sourceItem = sourceOrder.items.find((i: any) => i.id === moveItem.orderItemId)
    if (!sourceItem) continue

    const moveQty = Math.min(Number(moveItem.quantity) || sourceItem.quantity, sourceItem.quantity)

    if (moveQty >= sourceItem.quantity) {
      // Move entire item
      await prisma.orderItem.update({
        where: { id: sourceItem.id },
        data: { orderId: targetOrderId },
      })
    } else {
      // Split: reduce source quantity, create new item in target
      await prisma.orderItem.update({
        where: { id: sourceItem.id },
        data: {
          quantity: sourceItem.quantity - moveQty,
          subtotal: Number(sourceItem.unitPrice) * (sourceItem.quantity - moveQty),
        },
      })
      await prisma.orderItem.create({
        data: {
          orderId: targetOrderId,
          productId: sourceItem.productId,
          quantity: moveQty,
          unitPrice: Number(sourceItem.unitPrice),
          subtotal: Number(sourceItem.unitPrice) * moveQty,
          notes: sourceItem.notes,
        },
      })
    }
  }

  // Recalculate both orders
  for (const oid of [orderId, targetOrderId]) {
    const orderItems = await prisma.orderItem.findMany({ where: { orderId: oid } })
    const subtotal = orderItems.reduce((sum, i) => sum + Number(i.subtotal), 0)

    const loc = session.locationId
    const charges = await calculateCharges(loc, subtotal)

    await prisma.order.update({
      where: { id: oid },
      data: {
        subtotal,
        taxAmount: charges.taxAmount,
        serviceCharge: charges.serviceCharge,
        totalAmount: charges.totalAmount,
      },
    })
  }

  await logger.info(event, 'pos', 'ITEMS_MOVED', `Items moved from ${sourceOrder.orderNumber} to ${targetOrder.orderNumber}`, {
    userId: session.userId,
    locationId: session.locationId,
    metadata: { sourceOrderId: orderId, targetOrderId, itemCount: items.length },
  })

  // Return updated source order
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      cashier: { select: { id: true, name: true } },
    },
  })
})
