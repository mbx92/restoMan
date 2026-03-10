import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return accounts
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const account = await prisma.account.create({
      data: {
        name: body.name,
        type: body.type || 'CASH',
        balance: body.balance || 0,
        currency: body.currency || 'IDR',
        icon: body.icon,
        color: body.color,
      },
    })
    return account
  }
})
