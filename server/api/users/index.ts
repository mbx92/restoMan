import prisma from '../../utils/prisma'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const method = event.method

  // GET — list users for this tenant
  if (method === 'GET') {
    const users = await prisma.user.findMany({
      where: { tenantId: session.tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        pin: false,
        password: false,
        role: { select: { id: true, name: true } },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })
    return users
  }

  // POST — create user (admin-only)
  if (method === 'POST') {
    await requireRole(event, 'ADMIN')
    const body = await readBody(event)

    if (!body.name || !body.email || !body.password) {
      throw createError({ statusCode: 400, statusMessage: 'Nama, email, dan password wajib diisi' })
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      throw createError({ statusCode: 400, statusMessage: 'Email sudah terdaftar' })
    }

    // Get or validate role
    let roleId = body.roleId
    if (!roleId) {
      // Default to first non-admin role
      const defaultRole = await prisma.role.findFirst({
        where: { tenantId: session.tenantId, name: { not: 'ADMIN' } },
      })
      roleId = defaultRole?.id
    }

    if (!roleId) {
      throw createError({ statusCode: 400, statusMessage: 'Role tidak ditemukan' })
    }

    const hashedPassword = await bcrypt.hash(body.password, 10)

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        pin: body.pin || null,
        tenantId: session.tenantId,
        roleId,
        isActive: body.isActive !== false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        role: { select: { id: true, name: true } },
        createdAt: true,
      },
    })

    await logger.info(event, 'users', 'USER_CREATED', `User ${user.name} dibuat`, {
      userId: session.userId,
      locationId: session.locationId,
      metadata: { newUserId: user.id },
    })

    return user
  }
})
