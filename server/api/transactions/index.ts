import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method
  const query = getQuery(event)

  if (method === 'GET') {
    const transactions = await prisma.transaction.findMany({
      include: {
        account: true,
        category: true,
        tags: true,
      },
      orderBy: { date: 'desc' },
      take: Number(query.limit) || 50,
      skip: Number(query.offset) || 0,
    })
    return transactions
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const transaction = await prisma.transaction.create({
      data: {
        amount: body.amount,
        type: body.type,
        description: body.description,
        date: body.date ? new Date(body.date) : new Date(),
        accountId: body.accountId,
        categoryId: body.categoryId,
        transferToId: body.transferToId,
        tags: body.tagIds
          ? { connect: body.tagIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: {
        account: true,
        category: true,
        tags: true,
      },
    })

    // Update account balance
    if (body.type === 'EXPENSE') {
      await prisma.account.update({
        where: { id: body.accountId },
        data: { balance: { decrement: body.amount } },
      })
    } else if (body.type === 'INCOME') {
      await prisma.account.update({
        where: { id: body.accountId },
        data: { balance: { increment: body.amount } },
      })
    } else if (body.type === 'TRANSFER' && body.transferToId) {
      await prisma.account.update({
        where: { id: body.accountId },
        data: { balance: { decrement: body.amount } },
      })
      await prisma.account.update({
        where: { id: body.transferToId },
        data: { balance: { increment: body.amount } },
      })
    }

    return transaction
  }
})
