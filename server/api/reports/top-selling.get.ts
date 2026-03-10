import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const query = getQuery(event)

  const startDate = query.startDate ? new Date(query.startDate as string) : new Date(new Date().setDate(1))
  const endDate = query.endDate ? new Date(query.endDate as string) : new Date()
  endDate.setHours(23, 59, 59, 999)

  const items = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      order: {
        locationId: session.locationId,
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
    },
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 20,
  })

  // Enrich with product names
  const productIds = items.map(i => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, price: true, cost: true },
  })
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))

  return items.map(item => ({
    productId: item.productId,
    product: productMap[item.productId] || null,
    totalQty: item._sum.quantity || 0,
    totalRevenue: Number(item._sum.subtotal || 0),
  }))
})
