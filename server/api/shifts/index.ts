import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const method = event.method
  const query = getQuery(event)

  // GET — list shifts
  if (method === 'GET') {
    const where: any = { locationId: session.locationId }
    if (query.status) where.status = query.status

    const shifts = await prisma.cashRegisterShift.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { orders: true } },
      },
      take: Number(query.limit) || 50,
    })

    return shifts.map((s: any) => ({
      ...s,
      orderCount: s._count.orders,
      _count: undefined,
    }))
  }

  // POST — open new shift
  if (method === 'POST') {
    await requirePermission(event, 'pos.open_shift')

    // Check no open shift exists for this user at this location
    const existing = await prisma.cashRegisterShift.findFirst({
      where: {
        locationId: session.locationId,
        userId: session.userId,
        status: 'OPEN',
      },
    })

    if (existing) {
      throwError('SFT_ALREADY_OPEN')
    }

    const body = await readBody(event)
    const openingAmount = Number(body.openingAmount) || 0

    const prefix = await getSetting(session.locationId, 'prefix.shift')
    const shiftNumber = await nextSequence(session.locationId, prefix || 'SFT')

    const shift = await prisma.cashRegisterShift.create({
      data: {
        shiftNumber,
        openingAmount,
        userId: session.userId,
        locationId: session.locationId,
        notes: body.notes || null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    await logger.info(event, 'shift', 'SHIFT_OPENED', `Shift ${shiftNumber} dibuka`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { shiftId: shift.id, openingAmount },
    })

    return shift
  }
})
