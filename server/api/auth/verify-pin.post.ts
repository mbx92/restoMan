import prisma from '../../utils/prisma'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readBody(event)

  if (!body.pin) {
    throwError('AUTH_UNAUTHENTICATED', 'PIN dibutuhkan')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  })
  
  if (!user || !user.pin) {
    throwError('AUTH_UNAUTHENTICATED', 'PIN belum diatur untuk user ini')
  }

  const valid = await bcrypt.compare(body.pin, user.pin)
  if (!valid) {
    throwError('AUTH_UNAUTHENTICATED', 'PIN salah')
  }

  return { success: true }
})
