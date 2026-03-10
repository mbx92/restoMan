import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const method = event.method

  // GET — list products with stock tracking enabled
  if (method === 'GET') {
    const query = getQuery(event)
    const lowStockOnly = query.lowStock === 'true'

    const products = await prisma.product.findMany({
      where: {
        tenantId: session.tenantId,
        trackStock: true,
        ...(lowStockOnly ? { stock: { lte: 5 } } : {}),
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        cost: true,
        isActive: true,
        category: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    })
    return products
  }

  // POST — stock adjustment
  if (method === 'POST') {
    const body = await readBody(event)

    if (!body.productId || !body.quantity || !body.type) {
      throw createError({ statusCode: 400, statusMessage: 'Product, quantity, dan type wajib diisi' })
    }

    const product = await prisma.product.findFirst({
      where: { id: body.productId, tenantId: session.tenantId },
    })
    if (!product) throwError('PRD_NOT_FOUND')

    const qty = parseInt(body.quantity)
    const type = body.type as string

    // Calculate stock change
    let stockChange = qty
    if (type === 'OUT' || type === 'ORDER_DEDUCTION') {
      stockChange = -qty
    } else if (type === 'ADJUSTMENT') {
      // Adjustment sets absolute stock — calculate diff
      stockChange = qty - product.stock
    }

    // Update stock and create adjustment record
    const [updatedProduct, adjustment] = await prisma.$transaction([
      prisma.product.update({
        where: { id: body.productId },
        data: {
          stock: type === 'ADJUSTMENT' ? qty : { increment: stockChange },
        },
      }),
      prisma.stockAdjustment.create({
        data: {
          type: type as any,
          quantity: qty,
          reason: body.reason || null,
          reference: body.reference || null,
          productId: body.productId,
          userId: session.userId,
        },
      }),
    ])

    await logger.info(event, 'inventory', 'STOCK_ADJUSTED', `Stok ${product.name} diubah (${type}: ${qty})`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { productId: body.productId, type, quantity: qty, newStock: updatedProduct.stock },
    })

    return { product: updatedProduct, adjustment }
  }
})
