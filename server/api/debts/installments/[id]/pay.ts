import prisma from '../../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method
  if (method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const id = getRouterParam(event, 'id')

  // Cari cicilan
  const installment = await prisma.debtInstallment.findUnique({
    where: { id: id as string },
    include: { debt: true }
  })

  if (!installment) {
    throw createError({ statusCode: 404, statusMessage: 'Installment not found' })
  }

  if (installment.isPaid) {
    return { success: true, message: 'Installment already paid' }
  }

  // Transaction: Tandai cicilan lunas & tambah paidAmount di tabel Debts utama
  await prisma.$transaction([
    prisma.debtInstallment.update({
      where: { id: installment.id },
      data: {
        isPaid: true,
        paidAt: new Date(),
      }
    }),
    prisma.debt.update({
      where: { id: installment.debtId },
      data: {
        paidAmount: {
          increment: installment.amount
        }
      }
    })
  ])

  return { success: true }
})
