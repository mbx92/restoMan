import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const splitId = getRouterParam(event, 'splitId')!
  const body = await readBody(event)

  const splitBill = await prisma.splitBill.findUnique({
    where: { id: splitId },
    include: { order: true },
  })

  if (!splitBill) throwError('ORD_NOT_FOUND')
  if (splitBill.isPaid) throwError('ORD_ALREADY_PROCESSED')

  const paymentMethod = body.paymentMethod || 'CASH'
  const paidAmount = Number(body.paidAmount) || Number(splitBill.amount)
  const changeAmount = paidAmount - Number(splitBill.amount)

  if (paymentMethod === 'CASH' && paidAmount < Number(splitBill.amount)) {
    throwError('ORD_INSUFFICIENT_PAYMENT')
  }

  const updated = await prisma.splitBill.update({
    where: { id: splitId },
    data: {
      isPaid: true,
      paymentMethod,
      paidAmount,
      changeAmount: changeAmount > 0 ? changeAmount : 0,
      paidAt: new Date(),
    },
    include: { items: { include: { orderItem: { include: { product: true } } } } },
  })

  // Check if all split bills are paid — if so, mark order as completed
  const allSplits = await prisma.splitBill.findMany({
    where: { orderId: splitBill.orderId },
  })

  const allPaid = allSplits.every((s: any) => s.isPaid)
  if (allPaid) {
    const totalPaid = allSplits.reduce((sum: number, s: any) => sum + Number(s.paidAmount || 0), 0)
    await prisma.order.update({
      where: { id: splitBill.orderId },
      data: {
        status: 'COMPLETED',
        paymentMethod: 'CASH', // mixed
        paidAmount: totalPaid,
        changeAmount: 0,
        paidAt: new Date(),
      },
    })

    await logger.info(event, 'pos', 'ORDER_COMPLETED_VIA_SPLIT', `Order ${splitBill.order.orderNumber} completed via split bill`, {
      userId: session.userId,
      locationId: session.locationId,
    })
  }

  return updated
})
