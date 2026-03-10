import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  await requirePermission(event, 'pos.split_bill')

  const orderId = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const order = await prisma.order.findFirst({
    where: { id: orderId, locationId: session.locationId },
    include: { items: { include: { product: true } } },
  })

  if (!order) throwError('ORD_NOT_FOUND')
  if (order.status !== 'PENDING') throwError('SPL_ORDER_NOT_PENDING')

  const { splitType, splits } = body
  // splitType: 'EQUAL' or 'BY_ITEM'
  // splits: for EQUAL — { count: number }
  //         for BY_ITEM — [{ label?, items: [{ orderItemId, quantity }] }]

  const prefix = await getSetting(session.locationId, 'prefix.split')

  if (splitType === 'EQUAL') {
    const count = Number(splits?.count)
    if (!count || count < 2) throwError('SPL_INVALID_COUNT')

    const totalAmount = Number(order.totalAmount)
    const perPerson = Math.floor(totalAmount / count)
    const remainder = totalAmount - perPerson * count

    const created = []
    for (let i = 0; i < count; i++) {
      const billNumber = await nextSequence(session.locationId, prefix || 'SPL')
      const amount = i === 0 ? perPerson + remainder : perPerson

      const bill = await prisma.splitBill.create({
        data: {
          billNumber,
          splitType: 'EQUAL',
          amount,
          orderId: order.id,
          label: `Bill ${i + 1}/${count}`,
        },
      })
      created.push(bill)
    }

    await logger.info(event, 'pos', 'SPLIT_BILL_EQUAL', `Order ${order.orderNumber} split rata ${count} orang`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { orderId: order.id, count },
    })

    return created
  }

  if (splitType === 'BY_ITEM') {
    if (!Array.isArray(splits) || splits.length < 2) throwError('SPL_INVALID_COUNT')

    const created = []
    for (let i = 0; i < splits.length; i++) {
      const split = splits[i]
      if (!Array.isArray(split.items) || !split.items.length) throwError('SPL_ITEMS_REQUIRED')

      let amount = 0
      const itemsData = []

      for (const si of split.items) {
        const orderItem = order.items.find((oi: any) => oi.id === si.orderItemId)
        if (!orderItem) throwError('ORD_PRODUCT_NOT_FOUND')

        const qty = Number(si.quantity) || orderItem.quantity
        const itemAmount = Number(orderItem.unitPrice) * qty
        amount += itemAmount

        itemsData.push({
          orderItemId: si.orderItemId,
          quantity: qty,
          amount: itemAmount,
        })
      }

      // Apply proportional tax & service
      const proportion = amount / Number(order.subtotal)
      const taxPortion = Math.round(Number(order.taxAmount) * proportion)
      const servicePortion = Math.round(Number(order.serviceCharge) * proportion)
      amount += taxPortion + servicePortion

      const billNumber = await nextSequence(session.locationId, prefix || 'SPL')

      const bill = await prisma.splitBill.create({
        data: {
          billNumber,
          splitType: 'BY_ITEM',
          amount,
          orderId: order.id,
          label: split.label || `Bill ${i + 1}`,
          items: { create: itemsData },
        },
        include: { items: true },
      })
      created.push(bill)
    }

    await logger.info(event, 'pos', 'SPLIT_BILL_ITEMS', `Order ${order.orderNumber} split per item (${splits.length} bill)`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { orderId: order.id, billCount: splits.length },
    })

    return created
  }

  throwError('ORD_INVALID_ACTION')
})
