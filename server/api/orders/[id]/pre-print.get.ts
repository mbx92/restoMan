import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const orderId = getRouterParam(event, 'id')!

  const order = await prisma.order.findFirst({
    where: { id: orderId, locationId: session.locationId },
    include: {
      items: { include: { product: true } },
      cashier: { select: { id: true, name: true } },
      splitBills: { include: { items: { include: { orderItem: { include: { product: true } } } } } },
      location: { include: { tenant: true } },
    },
  })

  if (!order) throwError('ORD_NOT_FOUND')

  // Gather location settings for the receipt
  const settings = await getAllSettings(session.locationId)

  await logger.info(event, 'pos', 'PRE_PRINT', `Pre-print bill for ${order.orderNumber}`, {
    userId: session.userId,
    locationId: session.locationId,
    metadata: { orderId },
  })

  return {
    order,
    settings: {
      taxEnabled: settings['tax.enabled'] === 'true',
      taxRate: Number(settings['tax.rate']) || 0,
      taxName: settings['tax.name'] || 'PPN',
      taxInclusive: settings['tax.inclusive'] === 'true',
      serviceEnabled: settings['service.enabled'] === 'true',
      serviceRate: Number(settings['service.rate']) || 0,
      serviceName: settings['service.name'] || 'Service Charge',
      currency: settings['general.currency'] || 'IDR',
    },
    rawSettings: settings,
    tenant: order.location?.tenant,
    location: order.location,
  }
})
