import bcrypt from 'bcryptjs'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
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
          isActive: true,
          locations: {
            where: { isActive: true },
            select: { id: true, name: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
  })

  if (!user || !(await bcrypt.compare(password, user.password))) {
    await logger.warn(event, 'auth', 'LOGIN_FAILED', `Login gagal untuk ${email}`, {
      errorCode: 'AUTH-001',
    })
    throwError('AUTH_INVALID_CREDENTIALS')
  }

  if (!user.isActive) {
    throwError('AUTH_USER_INACTIVE')
  }

  if (!user.tenant.isActive) {
    throwError('TNT_INACTIVE')
  }

  // Set session cookie
  setCookie(event, 'mm_session', user.id, {
    secure: !import.meta.dev,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  // Auto-select first location if only one
  const locations = user.tenant.locations
  if (locations.length === 1) {
    setCookie(event, 'mm_location', locations[0].id, {
      secure: !import.meta.dev,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
  }

  await logger.info(event, 'auth', 'LOGIN_SUCCESS', `${user.name} berhasil login`, {
    userId: user.id,
    metadata: { email: user.email },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    role: {
      id: user.role.id,
      name: user.role.name,
      permissions: user.role.permissions.map((rp: any) => rp.permission.code),
    },
    tenant: user.tenant,
    locations,
  }
})
