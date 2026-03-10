import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const method = event.method

  // DELETE — delete expense
  if (method === 'DELETE') {
    await prisma.expense.delete({ where: { id } })
    return { success: true }
  }

  // PUT — update expense
  if (method === 'PUT') {
    const body = await readBody(event)
    return prisma.expense.update({
      where: { id },
      data: {
        description: body.description,
        amount: body.amount,
        category: body.category,
        date: body.date ? new Date(body.date) : undefined,
      },
    })
  }
})
