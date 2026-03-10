import type { SessionUser } from '~/types'

interface AuthUser {
  id: string
  name: string
  email: string
  tenantId: string
  locationId: string | null
  role: {
    id: string
    name: string
    permissions: string[]
  }
  tenant: {
    id: string
    name: string
    slug: string
    locations: Array<{ id: string; name: string }>
  }
  locations: Array<{ id: string; name: string }>
}

export const useAuth = () => {
  const sessionCookie = useCookie<string | null>('mm_session', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  const locationCookie = useCookie<string | null>('mm_location', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  const user = useState<AuthUser | null>('auth_user', () => null)

  const isLoggedIn = computed(() => !!sessionCookie.value)
  const isAdmin = computed(() => user.value?.role.name === 'ADMIN')
  const currentLocationId = computed(() => locationCookie.value || user.value?.locationId || null)

  const currentLocation = computed(() => {
    if (!user.value || !currentLocationId.value) return null
    return user.value.locations.find(l => l.id === currentLocationId.value) || null
  })

  function hasPermission(...codes: string[]): boolean {
    if (!user.value) return false
    if (user.value.role.name === 'ADMIN') return true
    return codes.some(code => user.value!.role.permissions.includes(code))
  }

  async function fetchUser() {
    if (!sessionCookie.value) return
    try {
      const data = await $fetch<AuthUser>('/api/auth/me')
      user.value = data
    } catch {
      user.value = null
    }
  }

  async function switchLocation(locationId: string) {
    await $fetch('/api/auth/switch-location', {
      method: 'POST',
      body: { locationId },
    })
    locationCookie.value = locationId
    if (user.value) {
      user.value = { ...user.value, locationId }
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    sessionCookie.value = null
    locationCookie.value = null
    user.value = null
    await navigateTo('/login')
  }

  const isLocked = useCookie<boolean>('mm_locked', {
    default: () => false,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  function lockScreen() {
    isLocked.value = true
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    isLocked,
    currentLocationId,
    currentLocation,
    hasPermission,
    fetchUser,
    switchLocation,
    logout,
    lockScreen,
  }
}
