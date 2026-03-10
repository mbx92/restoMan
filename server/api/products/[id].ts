import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const method = event.method

  // GET — single product
  if (method === 'GET') {
    const product = await prisma.product.findFirst({
      where: { id, tenantId: session.tenantId },
      include: { category: true },
    })
    if (!product) throwError('PRD_NOT_FOUND')
    return product
  }

  // PUT — update product
  if (method === 'PUT') {
    await requirePermission(event, 'products.manage')
    const body = await readBody(event)
    return prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        sku: body.sku,
        description: body.description,
        price: body.price,
        cost: body.cost,
        image: body.image,
        stock: body.stock,
        trackStock: body.trackStock,
        sortOrder: body.sortOrder,
        categoryId: body.categoryId,
        isActive: body.isActive,
      },
      include: { category: true },
    })
  }

  // DELETE — soft delete
  if (method === 'DELETE') {
    await requirePermission(event, 'products.manage')
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    })
  }
})
