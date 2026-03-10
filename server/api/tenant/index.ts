import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const method = event.method

  // GET — get tenant info with locations
  if (method === 'GET') {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            isActive: true,
          },
          orderBy: { name: 'asc' },
        },
      },
    })
    if (!tenant) throwError('TNT_NOT_FOUND')
    return tenant
  }

  // PUT — update tenant (admin-only)
  if (method === 'PUT') {
    await requireRole(event, 'ADMIN')
    const body = await readBody(event)

    const updated = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        name: body.name || undefined,
      },
    })

    await logger.info(event, 'tenant', 'TENANT_UPDATED', `Tenant ${updated.name} diperbarui`, {
      userId: session.userId,
      locationId: session.locationId,
    })

    return updated
  }
})
