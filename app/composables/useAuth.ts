export const useAuth = () => {
  const sessionCookie = useCookie<string | null>('mm_session', {
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
    sameSite: 'lax',
  })

  const user = useState<{ id: string; email: string; name: string } | null>('auth_user', () => null)

  const isLoggedIn = computed(() => !!sessionCookie.value)

  async function fetchUser() {
    if (!sessionCookie.value) return
    try {
      user.value = await $fetch('/api/auth/me')
    } catch {
      user.value = null
    }
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    sessionCookie.value = null
    user.value = null
    await navigateTo('/login')
  }

  return { user, isLoggedIn, fetchUser, logout }
}
