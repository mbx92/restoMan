import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method
  const query = getQuery(event)

  // GET — list expenses
  if (method === 'GET') {
    const where: any = {}
    if (query.date) {
      const d = new Date(query.date as string)
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const end = new Date(start.getTime() + 86400000)
      where.date = { gte: start, lt: end }
    }

    return prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: Number(query.limit) || 50,
    })
  }

  // POST — create expense
  if (method === 'POST') {
    const body = await readBody(event)
    if (!body.description || !body.amount) {
      throw createError({ statusCode: 400, statusMessage: 'Deskripsi dan jumlah wajib diisi' })
    }
    return prisma.expense.create({
      data: {
        description: body.description,
        amount: body.amount,
        category: body.category || null,
        date: body.date ? new Date(body.date) : new Date(),
      },
    })
  }
})
