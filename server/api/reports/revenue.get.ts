import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const query = getQuery(event)

  const startDate = query.startDate ? new Date(query.startDate as string) : new Date(new Date().setDate(1))
  const endDate = query.endDate ? new Date(query.endDate as string) : new Date()
  endDate.setHours(23, 59, 59, 999)

  const orders = await prisma.order.findMany({
    where: {
      locationId: session.locationId,
      status: 'COMPLETED',
      paidAt: { gte: startDate, lte: endDate },
    },
    select: {
      totalAmount: true,
      taxAmount: true,
      serviceCharge: true,
      discountAmount: true,
      paymentMethod: true,
      paidAt: true,
    },
  })

  // Calculate totals
  let totalRevenue = 0
  let totalTax = 0
  let totalService = 0
  let totalDiscount = 0
  const byPayment: Record<string, number> = {}
  const byDate: Record<string, number> = {}

  for (const o of orders) {
    const amount = Number(o.totalAmount)
    totalRevenue += amount
    totalTax += Number(o.taxAmount)
    totalService += Number(o.serviceCharge)
    totalDiscount += Number(o.discountAmount)

    const method = o.paymentMethod || 'CASH'
    byPayment[method] = (byPayment[method] || 0) + amount

    if (o.paidAt) {
      const dateKey = o.paidAt.toISOString().split('T')[0]
      byDate[dateKey] = (byDate[dateKey] || 0) + amount
    }
  }

  return {
    totalRevenue,
    totalTax,
    totalService,
    totalDiscount,
    orderCount: orders.length,
    byPayment,
    byDate,
  }
})
