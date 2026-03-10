import prisma from '../../../utils/prisma'
import { directPrint } from '../../../utils/thermalPrinter'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const orderId = getRouterParam(event, 'id')!
  const body = await readBody<{ type: 'receipt' | 'kitchen' | 'pre-print' }>(event)

  if (!body?.type || !['receipt', 'kitchen', 'pre-print'].includes(body.type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid print type' })
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, locationId: session.locationId },
    include: {
      items: { include: { product: true } },
      cashier: { select: { id: true, name: true } },
      location: { include: { tenant: true } },
    },
  })

  if (!order) throwError('ORD_NOT_FOUND')

  // Get all settings
  const allSettings = await getAllSettings(session.locationId)

  // Parse receipt settings
  const receiptSettings = {
    taxEnabled: allSettings['tax.enabled'] === 'true',
    taxRate: Number(allSettings['tax.rate']) || 0,
    taxName: allSettings['tax.name'] || 'PPN',
    taxInclusive: allSettings['tax.inclusive'] === 'true',
    serviceEnabled: allSettings['service.enabled'] === 'true',
    serviceRate: Number(allSettings['service.rate']) || 0,
    serviceName: allSettings['service.name'] || 'Service Charge',
    currency: allSettings['general.currency'] || 'IDR',
  }

  // Parse printer configs
  let printerConfigs: any[] = []
  try {
    printerConfigs = JSON.parse(allSettings.printers || '[]')
  } catch {
    printerConfigs = []
  }

  if (!printerConfigs.length) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada printer yang dikonfigurasi' })
  }

  const info = {
    tenantName: allSettings['receipt.name'] || order.location?.tenant?.name || '',
    locationName: !allSettings['receipt.name'] ? (order.location?.name || '') : '',
    locationAddress: allSettings['receipt.address'] || order.location?.address || undefined,
    locationPhone: allSettings['receipt.phone'] || order.location?.phone || undefined,
    footerLine1: allSettings['receipt.footer1'] || 'Terima Kasih!',
    footerLine2: allSettings['receipt.footer2'] || 'Silakan Datang Kembali',
  }

  // Convert Prisma Decimal fields to plain numbers and Date to string
  const printableOrder = {
    ...order,
    subtotal: Number(order.subtotal),
    taxAmount: Number(order.taxAmount),
    serviceCharge: Number(order.serviceCharge),
    discountAmount: Number(order.discountAmount),
    totalAmount: Number(order.totalAmount),
    paidAmount: order.paidAmount ? Number(order.paidAmount) : null,
    changeAmount: order.changeAmount ? Number(order.changeAmount) : null,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      createdAt: item.createdAt.toISOString(),
    })),
  }

  // Direct print to thermal printers
  const result = await directPrint(printableOrder, receiptSettings, info, printerConfigs, body.type)

  await logger.info(event, 'pos', 'DIRECT_PRINT', `Direct print ${body.type} for ${order.orderNumber}`, {
    userId: session.userId,
    locationId: session.locationId,
    metadata: { orderId, type: body.type, results: result.results },
  })

  return result
})
