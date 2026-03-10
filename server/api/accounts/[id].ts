import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const method = event.method

  if (method === 'PUT') {
    const body = await readBody(event)
    const account = await prisma.account.update({
      where: { id: id as string },
      data: {
        name: body.name,
        type: body.type,
        balance: body.balance,
        icon: body.icon ?? null,
        color: body.color,
      },
    })
    return account
  }

  if (method === 'DELETE') {
    await prisma.account.delete({
      where: { id: id as string },
    })
    return { success: true }
  }
})
