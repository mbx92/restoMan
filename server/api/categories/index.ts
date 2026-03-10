import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  // GET — list categories
  if (method === 'GET') {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    return categories.map((c: any) => ({
      ...c,
      productCount: c._count.products,
      _count: undefined,
    }))
  }

  // POST — create category
  if (method === 'POST') {
    const body = await readBody(event)
    if (!body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Nama kategori wajib diisi' })
    }
    return prisma.category.create({
      data: {
        name: body.name,
        icon: body.icon || null,
        color: body.color || null,
        sortOrder: body.sortOrder ?? 0,
      },
    })
  }
})
