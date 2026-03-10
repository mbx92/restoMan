import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const method = event.method

  // GET — single category
  if (method === 'GET') {
    const category = await prisma.category.findFirst({
      where: { id, tenantId: session.tenantId },
      include: { products: { where: { isActive: true } } },
    })
    if (!category) throwError('CAT_NOT_FOUND')
    return category
  }

  // PUT — update category
  if (method === 'PUT') {
    await requirePermission(event, 'products.manage')
    const body = await readBody(event)
    return prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        icon: body.icon,
        color: body.color,
        sortOrder: body.sortOrder,
        isActive: body.isActive,
      },
    })
  }

  // DELETE — soft delete
  if (method === 'DELETE') {
    await requirePermission(event, 'products.manage')
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    })
  }
})
