import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const method = event.method

  // GET — list categories
  if (method === 'GET') {
    const categories = await prisma.category.findMany({
      where: { isActive: true, tenantId: session.tenantId },
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
    await requirePermission(event, 'products.manage')
    const body = await readBody(event)
    if (!body.name) throwError('CAT_NAME_REQUIRED')

    return prisma.category.create({
      data: {
        name: body.name,
        icon: body.icon || null,
        color: body.color || null,
        sortOrder: body.sortOrder ?? 0,
        tenantId: session.tenantId,
      },
    })
  }
})
