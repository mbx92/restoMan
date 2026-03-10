import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const method = event.method

  // GET — single category
  if (method === 'GET') {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { products: { where: { isActive: true } } },
    })
    if (!category) throw createError({ statusCode: 404, statusMessage: 'Kategori tidak ditemukan' })
    return category
  }

  // PUT — update category
  if (method === 'PUT') {
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
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    })
  }
})
