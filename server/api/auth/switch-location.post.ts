export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readBody(event)
  const { locationId } = body

  if (!locationId) throwError('LOC_NOT_SET')

  // Verify location belongs to tenant
  const location = await prisma.location.findFirst({
    where: { id: locationId, tenantId: session.tenantId, isActive: true },
  })

  if (!location) throwError('LOC_NOT_FOUND')

  setCookie(event, 'mm_location', locationId, {
    secure: !import.meta.dev,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  await logger.info(event, 'auth', 'LOCATION_SWITCHED', `Switched to ${location.name}`, {
    userId: session.userId,
    locationId,
  })

  return { success: true, location }
})
