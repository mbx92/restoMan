import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const method = event.method
  const query = getQuery(event)

  // GET — list products
  if (method === 'GET') {
    const where: any = { tenantId: session.tenantId }
    if (query.active !== 'all') where.isActive = true
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
      include: {
        category: true,
        variantGroups: {
          include: { options: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    })
  }

  // POST — create product
  if (method === 'POST') {
    await requirePermission(event, 'products.manage')
    const body = await readBody(event)
    if (!body.name || !body.categoryId) throwError('PRD_NAME_REQUIRED')

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
        tenantId: session.tenantId,
      },
      include: { category: true },
    })
  }
})
