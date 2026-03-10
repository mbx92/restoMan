import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const query = getQuery(event)

  const startDate = query.startDate ? new Date(query.startDate as string) : new Date(new Date().setDate(1))
  const endDate = query.endDate ? new Date(query.endDate as string) : new Date()
  endDate.setHours(23, 59, 59, 999)

  // Revenue from completed orders
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
      subtotal: true,
      items: {
        select: {
          quantity: true,
          unitPrice: true,
          product: { select: { cost: true } },
        },
      },
    },
  })

  let totalRevenue = 0
  let totalSubtotal = 0
  let totalTax = 0
  let totalService = 0
  let totalDiscount = 0
  let totalCOGS = 0

  for (const o of orders) {
    totalRevenue += Number(o.totalAmount)
    totalSubtotal += Number(o.subtotal)
    totalTax += Number(o.taxAmount)
    totalService += Number(o.serviceCharge)
    totalDiscount += Number(o.discountAmount)

    for (const item of o.items) {
      totalCOGS += Number(item.product?.cost || 0) * item.quantity
    }
  }

  // Expenses
  const expenses = await prisma.expense.findMany({
    where: {
      locationId: session.locationId,
      date: { gte: startDate, lte: endDate },
    },
    select: { amount: true, category: true },
  })

  let totalExpenses = 0
  const expenseByCategory: Record<string, number> = {}
  for (const e of expenses) {
    const amt = Number(e.amount)
    totalExpenses += amt
    const cat = e.category || 'Lainnya'
    expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt
  }

  const grossProfit = totalSubtotal - totalCOGS
  const netProfit = totalRevenue - totalCOGS - totalExpenses

  return {
    totalRevenue,
    totalSubtotal,
    totalTax,
    totalService,
    totalDiscount,
    totalCOGS,
    grossProfit,
    totalExpenses,
    expenseByCategory,
    netProfit,
    orderCount: orders.length,
  }
})
