import prisma from './prisma'
import type { H3Event } from 'h3'

export interface AuthSession {
  userId: string
  tenantId: string
  locationId: string
  role: {
    id: string
    name: string
    permissions: string[]
  }
}

/**
 * Get authenticated session from cookie. Throws if not authenticated.
 */
export async function requireAuth(event: H3Event): Promise<AuthSession> {
  const sessionId = getCookie(event, 'mm_session')
  if (!sessionId) {
    throwError('AUTH_UNAUTHENTICATED')
  }

  const locationId = getCookie(event, 'mm_location') || ''

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      isActive: true,
      tenantId: true,
      role: {
        select: {
          id: true,
          name: true,
          permissions: {
            select: { permission: { select: { code: true } } },
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
    userId: user.id,
    tenantId: user.tenantId,
    locationId,
    role: {
      id: user.role.id,
      name: user.role.name,
      permissions: user.role.permissions.map((rp: any) => rp.permission.code),
    },
  }
}

/**
 * Require specific permission(s). Pass multiple for OR logic.
 */
export async function requirePermission(event: H3Event, ...codes: string[]): Promise<AuthSession> {
  const session = await requireAuth(event)

  // Admin role bypasses permission checks
  if (session.role.name === 'ADMIN') return session

  const hasAny = codes.some(code => session.role.permissions.includes(code))
  if (!hasAny) {
    throwError('AUTH_PERMISSION_DENIED')
  }

  return session
}

/**
 * Require a specific role by name
 */
export async function requireRole(event: H3Event, ...roleNames: string[]): Promise<AuthSession> {
  const session = await requireAuth(event)
  if (!roleNames.includes(session.role.name)) {
    throwError('AUTH_FORBIDDEN')
  }
  return session
}

/**
 * Ensure location is set and valid
 */
export async function requireLocation(event: H3Event): Promise<AuthSession & { locationId: string }> {
  const session = await requireAuth(event)

  if (!session.locationId) {
    throwError('LOC_NOT_SET')
  }

  const location = await prisma.location.findFirst({
    where: {
      id: session.locationId,
      tenantId: session.tenantId,
      isActive: true,
    },
  })

  if (!location) {
    throwError('LOC_NOT_FOUND')
  }

  return session as AuthSession & { locationId: string }
}
