import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'mm_session')
  const locationId = getCookie(event, 'mm_location') || null

  if (!sessionId) {
    throwError('AUTH_UNAUTHENTICATED')
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
      tenantId: true,
      role: {
        select: {
          id: true,
          name: true,
          permissions: { select: { permission: { select: { code: true } } } },
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          locations: {
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!user) {
    throwError('AUTH_UNAUTHENTICATED')
  }

  if (!user.isActive) {
    throwError('AUTH_USER_INACTIVE')
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    locationId,
    role: {
      id: user.role.id,
      name: user.role.name,
      permissions: user.role.permissions.map((rp: any) => rp.permission.code),
    },
    tenant: user.tenant,
    locations: user.tenant.locations,
  }
})
