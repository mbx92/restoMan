import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const method = event.method

  if (method === 'PUT') {
    const body = await readBody(event)
    const investment = await prisma.investment.update({
      where: { id: id as string },
      data: {
        name: body.name,
        type: body.type,
        initialAmount: body.initialAmount,
        currentValue: body.currentValue,
        ticker: body.ticker ?? null,
        quantity: body.quantity !== undefined ? Number(body.quantity) : null,
        platform: body.platform ?? null,
        notes: body.notes ?? null,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
      },
    })
    return investment
  }

  if (method === 'DELETE') {
    await prisma.investment.delete({
      where: { id: id as string },
    })
    return { success: true }
  }
})
