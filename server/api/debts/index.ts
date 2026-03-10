import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const debts = await prisma.debt.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        installments: {
          orderBy: { sequence: 'asc' },
        },
      },
    })
    return debts
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const durationMonths = body.durationMonths ? parseInt(body.durationMonths, 10) : null
    let totalAmount = body.totalAmount ? Number(body.totalAmount) : 0
    const interestRate = body.interestRate ? Number(body.interestRate) : null
    const firstDueDate = body.dueDate ? new Date(body.dueDate) : new Date()

    // Hitung total bunga jika ada tenor dan bunga
    let originalAmount = totalAmount
    if (durationMonths && durationMonths > 0 && interestRate !== null && interestRate > 0) {
      const years = durationMonths / 12
      const totalInterest = originalAmount * (interestRate / 100) * years
      totalAmount = originalAmount + totalInterest
    }

    const debt = await prisma.debt.create({
      data: {
        name: body.name,
        type: body.type || 'PAYABLE',
        totalAmount,
        paidAmount: body.paidAmount || 0,
        counterparty: body.counterparty || null,
        notes: body.notes || null,
        dueDate: firstDueDate,
        durationMonths,
        interestRate,
      },
    })

    // Auto-generate installments if duration is set
    if (durationMonths && durationMonths > 0) {
      const installmentAmount = totalAmount / durationMonths
      const installmentsData = []

      for (let i = 0; i < durationMonths; i++) {
        const instDate = new Date(firstDueDate)
        instDate.setMonth(instDate.getMonth() + i)

        installmentsData.push({
          debtId: debt.id,
          sequence: i + 1,
          amount: installmentAmount,
          dueDate: instDate,
        })
      }

      if (installmentsData.length > 0) {
        await prisma.debtInstallment.createMany({
          data: installmentsData,
        })
      }
    }

    return debt
  }
})
