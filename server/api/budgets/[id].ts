import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const method = event.method

  if (method === 'PUT') {
    const body = await readBody(event)
    const budget = await prisma.budget.update({
      where: { id: id as string },
      data: {
        name: body.name,
        amount: body.amount,
        spent: body.spent,
        period: body.period,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        categoryId: body.categoryId || null,
      },
      include: { category: true },
    })
    return budget
  }

  if (method === 'DELETE') {
    await prisma.budget.delete({
      where: { id: id as string },
    })
    return { success: true }
  }
})
