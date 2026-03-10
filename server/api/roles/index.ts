import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  const roles = await prisma.role.findMany({
    where: { tenantId: session.tenantId },
    select: { id: true, name: true, description: true },
    orderBy: { name: 'asc' },
  })

  return roles
})
