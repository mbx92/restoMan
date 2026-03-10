import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const productId = getRouterParam(event, 'id')!
  const method = event.method

  // Verify product belongs to tenant
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId: session.tenantId },
  })
  if (!product) throwError('PRD_NOT_FOUND')

  // GET — list variant groups with options
  if (method === 'GET') {
    const groups = await prisma.variantGroup.findMany({
      where: { productId },
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    })
    return groups
  }

  // POST — create/update variant groups (bulk save)
  if (method === 'POST') {
    const body = await readBody(event)
    const groups = body.groups as Array<{
      id?: string
      name: string
      required: boolean
      multiple: boolean
      sortOrder: number
      options: Array<{
        id?: string
        name: string
        additionalPrice: number
        isActive: boolean
        sortOrder: number
      }>
    }>

    if (!groups || !Array.isArray(groups)) {
      throw createError({ statusCode: 400, statusMessage: 'Data variant tidak valid' })
    }

    // Delete existing groups and recreate (simpler bulk approach)
    await prisma.variantGroup.deleteMany({ where: { productId } })

    for (const group of groups) {
      await prisma.variantGroup.create({
        data: {
          name: group.name,
          required: group.required || false,
          multiple: group.multiple || false,
          sortOrder: group.sortOrder || 0,
          productId,
          options: {
            create: (group.options || []).map((opt, i) => ({
              name: opt.name,
              additionalPrice: opt.additionalPrice || 0,
              isActive: opt.isActive !== false,
              sortOrder: opt.sortOrder || i,
            })),
          },
        },
      })
    }

    // Return updated groups
    const updated = await prisma.variantGroup.findMany({
      where: { productId },
      include: { options: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    })

    return updated
  }
})
