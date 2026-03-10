import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(startOfDay.getTime() + 86400000)

  const dateFilter = { gte: startOfDay, lt: endOfDay }

  // Today's completed orders
  const orders = await prisma.order.findMany({
    where: { status: 'COMPLETED', paidAt: dateFilter, locationId: session.locationId },
    select: { totalAmount: true },
  })
  const todaySales = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0)
  const todayOrders = orders.length

  // Today's expenses
  const expenses = await prisma.expense.findMany({
    where: { date: dateFilter, locationId: session.locationId },
    select: { amount: true },
  })
  const todayExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return {
    todaySales,
    todayOrders,
    todayExpenses,
    netIncome: todaySales - todayExpenses,
  }
})
