export default defineEventHandler((event) => {
  deleteCookie(event, 'mm_session', { path: '/' })
  return { ok: true }
})
