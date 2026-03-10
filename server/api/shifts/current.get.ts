import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)

  const shift = await prisma.cashRegisterShift.findFirst({
    where: {
      locationId: session.locationId,
      userId: session.userId,
      status: 'OPEN',
    },
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { orders: true } },
    },
  })

  if (!shift) return null

  // Calculate total sales for this shift
  const salesAgg = await prisma.order.aggregate({
    where: { shiftId: shift.id, status: 'COMPLETED' },
    _sum: { totalAmount: true },
  })

  // Calculate total CASH sales
  const cashSalesAgg = await prisma.order.aggregate({
    where: { shiftId: shift.id, status: 'COMPLETED', paymentMethod: 'CASH' },
    _sum: { totalAmount: true },
  })

  return {
    ...shift,
    orderCount: (shift as any)._count.orders,
    totalSales: Number(salesAgg._sum.totalAmount) || 0,
    totalCashSales: Number(cashSalesAgg._sum.totalAmount) || 0,
    expectedAmount: Number(shift.openingAmount) + (Number(cashSalesAgg._sum.totalAmount) || 0),
    _count: undefined,
  }
})
