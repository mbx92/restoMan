import prisma from '../../utils/prisma'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readBody(event)

  const pinInput = String(body.pin || '').trim()
  if (!pinInput) {
    throwError('AUTH_UNAUTHENTICATED', 'PIN dibutuhkan')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, pin: true },
  })
  
  if (!user || !user.pin) {
    throwError('AUTH_UNAUTHENTICATED', 'PIN belum diatur untuk user ini')
  }

  const storedPin = user.pin
  const isHashed = storedPin.startsWith('$2')
  let valid = false

  if (isHashed) {
    valid = await bcrypt.compare(pinInput, storedPin)
  } else {
    // Legacy plain-text PIN — compare directly, then upgrade to hash
    valid = pinInput === storedPin
    if (valid) {
      const hashed = await bcrypt.hash(storedPin, 10)
      await prisma.user.update({ where: { id: user.id }, data: { pin: hashed } })
    }
  }

  if (!valid) {
    throwError('AUTH_UNAUTHENTICATED', 'PIN salah')
  }

  return { success: true }
})
