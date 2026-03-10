import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  await requirePermission(event, 'pos.move_table')

  const orderId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const { toTable } = body

  if (!toTable) throwError('TBL_NO_TABLE')

  const order = await prisma.order.findFirst({
    where: { id: orderId, locationId: session.locationId },
  })

  if (!order) throwError('ORD_NOT_FOUND')
  if (order.status !== 'PENDING') throwError('ORD_ONLY_PENDING')
  if (!order.tableNumber) throwError('TBL_NO_TABLE')
  if (order.tableNumber === toTable) throwError('TBL_SAME_TABLE')

  const fromTable = order.tableNumber

  // Update order table
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { tableNumber: toTable },
    include: {
      items: { include: { product: true } },
      cashier: { select: { id: true, name: true } },
    },
  })

  // Record transfer history
  await prisma.tableTransfer.create({
    data: {
      orderId,
      fromTable,
      toTable,
    },
  })

  await logger.info(event, 'pos', 'TABLE_MOVED', `Order ${order.orderNumber} pindah meja ${fromTable} → ${toTable}`, {
    userId: session.userId,
    locationId: session.locationId,
    metadata: { orderId, fromTable, toTable },
  })

  return updated
})
