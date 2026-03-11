import prisma from '../../utils/prisma'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const id = getRouterParam(event, 'id')!
  const method = event.method

  // GET — single user
  if (method === 'GET') {
    const user = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        pin: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!user) throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' })
    // Return hasPin boolean instead of the actual hash
    const { pin, ...rest } = user
    return { ...rest, hasPin: !!pin }
  }

  // PUT — update user (admin-only)
  if (method === 'PUT') {
    await requireRole(event, 'ADMIN')
    const body = await readBody(event)

    const existing = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId },
    })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' })

    // Check email uniqueness if changed
    if (body.email && body.email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: body.email } })
      if (emailTaken) throw createError({ statusCode: 400, statusMessage: 'Email sudah terdaftar' })
    }

    const updateData: any = {}
    if (body.name) updateData.name = body.name
    if (body.email) updateData.email = body.email
    if (body.roleId) updateData.roleId = body.roleId
    if (body.pin !== undefined) updateData.pin = body.pin ? await bcrypt.hash(body.pin, 10) : null
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    // Only hash password if provided
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
      },
    })

    await logger.info(event, 'users', 'USER_UPDATED', `User ${user.name} diperbarui`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { targetUserId: id },
    })

    return user
  }

  // DELETE — deactivate user (admin-only)
  if (method === 'DELETE') {
    await requireRole(event, 'ADMIN')

    const existing = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId },
    })
    if (!existing) throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' })

    // Prevent self-deactivation
    if (id === session.userId) {
      throw createError({ statusCode: 400, statusMessage: 'Tidak bisa menghapus akun sendiri' })
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    await logger.info(event, 'users', 'USER_DEACTIVATED', `User ${existing.name} dinonaktifkan`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { targetUserId: id },
    })

    return { success: true }
  }
})
