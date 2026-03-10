import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const id = getRouterParam(event, 'id')!
  const method = event.method

  // GET — single shift
  if (method === 'GET') {
    const shift = await prisma.cashRegisterShift.findFirst({
      where: { id, locationId: session.locationId },
      include: {
        user: { select: { id: true, name: true } },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            paymentMethod: true,
            status: true,
          },
        },
      },
    })
    if (!shift) throwError('SFT_NOT_FOUND')
    return shift
  }

  // PUT — close shift
  if (method === 'PUT') {
    await requirePermission(event, 'pos.close_shift')

    const shift = await prisma.cashRegisterShift.findFirst({
      where: { id, locationId: session.locationId },
      include: {
        orders: {
          where: { status: 'COMPLETED' },
          select: { totalAmount: true, paymentMethod: true },
        },
      },
    })

    if (!shift) throwError('SFT_NOT_FOUND')
    if (shift.status === 'CLOSED') throwError('SFT_ALREADY_CLOSED')

    // Check for pending orders
    const pendingCount = await prisma.order.count({
      where: { shiftId: id, status: 'PENDING' },
    })
    if (pendingCount > 0) throwError('SFT_HAS_PENDING')

    const body = await readBody(event)
    const closingAmount = Number(body.closingAmount) || 0

    // Calculate expected: opening + cash sales
    const cashSales = shift.orders
      .filter((o: any) => o.paymentMethod === 'CASH')
      .reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0)
    const expectedAmount = Number(shift.openingAmount) + cashSales
    const difference = closingAmount - expectedAmount

    const updated = await prisma.cashRegisterShift.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closingAmount,
        expectedAmount,
        difference,
        notes: body.notes || shift.notes,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    await logger.info(event, 'shift', 'SHIFT_CLOSED', `Shift ${shift.shiftNumber} ditutup`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { shiftId: id, closingAmount, expectedAmount, difference },
    })

    return updated
  }
})
