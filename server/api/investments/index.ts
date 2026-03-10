import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const investments = await prisma.investment.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return investments
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const investment = await prisma.investment.create({
      data: {
        name: body.name,
        type: body.type || 'OTHER',
        initialAmount: body.initialAmount || 0,
        currentValue: body.currentValue || 0,
        ticker: body.ticker || null,
        quantity: body.quantity ? Number(body.quantity) : null,
        platform: body.platform || null,
        notes: body.notes || null,
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
      },
    })
    return investment
  }
})
