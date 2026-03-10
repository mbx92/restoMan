import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method
  const query = getQuery(event)

  // GET — list products
  if (method === 'GET') {
    const where: any = {}
    if (query.active !== 'false') where.isActive = true
    if (query.categoryId) where.categoryId = query.categoryId as string
    if (query.search) {
      where.OR = [
        { name: { contains: query.search as string, mode: 'insensitive' } },
        { sku: { contains: query.search as string, mode: 'insensitive' } },
      ]
    }

    return prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { category: true },
    })
  }

  // POST — create product
  if (method === 'POST') {
    const body = await readBody(event)
    if (!body.name || !body.categoryId) {
      throw createError({ statusCode: 400, statusMessage: 'Nama dan kategori wajib diisi' })
    }
    return prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku || null,
        description: body.description || null,
        price: body.price ?? 0,
        cost: body.cost ?? 0,
        image: body.image || null,
        stock: body.stock ?? 0,
        trackStock: body.trackStock ?? false,
        sortOrder: body.sortOrder ?? 0,
        categoryId: body.categoryId,
      },
      include: { category: true },
    })
  }
})
