export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') return

  const sessionCookie = useCookie('mm_session')
  if (!sessionCookie.value) {
    return navigateTo('/login')
  }
})
