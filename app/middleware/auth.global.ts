export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') return

  const sessionCookie = useCookie('mm_session')
  if (!sessionCookie.value) {
    // Clear lock state so login screen shows cleanly
    const locked = useCookie('mm_locked')
    locked.value = false
    return navigateTo('/login')
  }
})
