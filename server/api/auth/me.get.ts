import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'mm_session')

  if (!sessionId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthenticated' })
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    select: { id: true, email: true, name: true },
  })

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthenticated' })
  }

  return user
})
