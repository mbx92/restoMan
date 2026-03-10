import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const method = event.method

  // GET — list locations for tenant
  if (method === 'GET') {
    const locations = await prisma.location.findMany({
      where: { tenantId: session.tenantId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })
    return locations
  }

  // POST — create location (admin-only)
  if (method === 'POST') {
    await requireRole(event, 'ADMIN')
    const body = await readBody(event)

    if (!body.name) {
      throw createError({ statusCode: 400, statusMessage: 'Nama lokasi wajib diisi' })
    }

    const location = await prisma.location.create({
      data: {
        name: body.name,
        address: body.address || null,
        phone: body.phone || null,
        tenantId: session.tenantId,
      },
    })

    await logger.info(event, 'tenant', 'LOCATION_CREATED', `Lokasi ${location.name} dibuat`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { newLocationId: location.id },
    })

    return location
  }
})
