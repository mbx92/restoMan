import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const budgets = await prisma.budget.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })
    return budgets
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const budget = await prisma.budget.create({
      data: {
        name: body.name,
        amount: body.amount || 0,
        spent: body.spent || 0,
        period: body.period || 'MONTHLY',
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        endDate: body.endDate ? new Date(body.endDate) : null,
        categoryId: body.categoryId || null,
      },
      include: { category: true },
    })
    return budget
  }
})
