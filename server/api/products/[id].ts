import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const method = event.method

  // GET — single product
  if (method === 'GET') {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    })
    if (!product) throw createError({ statusCode: 404, statusMessage: 'Produk tidak ditemukan' })
    return product
  }

  // PUT — update product
  if (method === 'PUT') {
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
    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    })
  }
})
