import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireLocation(event)
  const method = event.method

  // GET — list all settings for location
  if (method === 'GET') {
    await requirePermission(event, 'settings.view')
    const settings = await getAllSettings(session.locationId)
    return settings
  }

  // PUT — bulk update settings
  if (method === 'PUT') {
    await requirePermission(event, 'settings.edit')
    const body = await readBody(event)

    if (!body || typeof body !== 'object') {
      throwError('SET_NOT_FOUND')
    }

    const results = []
    for (const [key, value] of Object.entries(body as Record<string, string>)) {
      const result = await setSetting(session.locationId, key, String(value))
      results.push(result)
    }

    await logger.info(event, 'settings', 'SETTINGS_UPDATED', `Updated ${results.length} settings`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { keys: Object.keys(body) },
    })

    return { success: true, count: results.length }
  }
})
