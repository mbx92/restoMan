import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    const categories = await prisma.category.findMany({
      include: { children: true },
      where: { parentId: null },
      orderBy: { name: 'asc' },
    })
    return categories
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const category = await prisma.category.create({
      data: {
        name: body.name,
        type: body.type,
        icon: body.icon,
        color: body.color,
        parentId: body.parentId,
      },
    })
    return category
  }
})
