import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  await prisma.$connect()
  const email = 'admin@moneyman.com'
  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    console.log(`User ${email} sudah ada, skip.`)
    return
  }

  const hashed = await bcrypt.hash('admin123', 12)
  const user = await prisma.user.create({
    data: {
      name: 'Admin',
      email,
      password: hashed,
    },
  })

  console.log(`User dibuat: ${user.email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
