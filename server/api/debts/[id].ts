import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const method = event.method

  if (method === 'PUT') {
    const body = await readBody(event)
    const debt = await prisma.debt.update({
      where: { id: id as string },
      data: {
        name: body.name,
        type: body.type,
        totalAmount: body.totalAmount,
        paidAmount: body.paidAmount,
        counterparty: body.counterparty ?? null,
        notes: body.notes ?? null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        durationMonths: body.durationMonths ? parseInt(body.durationMonths, 10) : null,
        interestRate: body.interestRate ? Number(body.interestRate) : null,
      },
      include: {
        installments: {
          orderBy: { sequence: 'asc' },
        },
      },
    })
    return debt
  }

  if (method === 'DELETE') {
    await prisma.debt.delete({
      where: { id: id as string },
    })
    return { success: true }
  }
})
