import { PrismaClient } from '../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restoman.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@restoman.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log(`✓ Admin user: ${admin.email}`)

  // Create cashier user
  const cashierPassword = await hash('kasir123', 12)
  const cashier = await prisma.user.upsert({
    where: { email: 'kasir@restoman.com' },
    update: {},
    create: {
      name: 'Kasir 1',
      email: 'kasir@restoman.com',
      password: cashierPassword,
      role: 'CASHIER',
    },
  })
  console.log(`✓ Cashier user: ${cashier.email}`)

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Makanan', icon: '🍔', color: '#ef4444', sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: 'Minuman', icon: '🥤', color: '#3b82f6', sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: 'Snack', icon: '🍟', color: '#f59e0b', sortOrder: 3 },
    }),
    prisma.category.create({
      data: { name: 'Dessert', icon: '🍰', color: '#ec4899', sortOrder: 4 },
    }),
  ])
  console.log(`✓ Created ${categories.length} categories`)

  const [makanan, minuman, snack, dessert] = categories

  // Create products
  const products = await Promise.all([
    // Makanan
    prisma.product.create({
      data: { name: 'Nasi Goreng Special', sku: 'MKN-001', price: 25000, cost: 12000, categoryId: makanan.id },
    }),
    prisma.product.create({
      data: { name: 'Mie Goreng Seafood', sku: 'MKN-002', price: 28000, cost: 14000, categoryId: makanan.id },
    }),
    prisma.product.create({
      data: { name: 'Ayam Bakar', sku: 'MKN-003', price: 35000, cost: 18000, categoryId: makanan.id },
    }),
    prisma.product.create({
      data: { name: 'Sate Ayam (10 tusuk)', sku: 'MKN-004', price: 30000, cost: 15000, categoryId: makanan.id },
    }),
    prisma.product.create({
      data: { name: 'Nasi Putih', sku: 'MKN-005', price: 5000, cost: 2000, categoryId: makanan.id },
    }),

    // Minuman
    prisma.product.create({
      data: { name: 'Es Teh Manis', sku: 'MNM-001', price: 8000, cost: 2000, categoryId: minuman.id },
    }),
    prisma.product.create({
      data: { name: 'Es Jeruk', sku: 'MNM-002', price: 10000, cost: 3000, categoryId: minuman.id },
    }),
    prisma.product.create({
      data: { name: 'Kopi Hitam', sku: 'MNM-003', price: 8000, cost: 2500, categoryId: minuman.id },
    }),
    prisma.product.create({
      data: { name: 'Jus Alpukat', sku: 'MNM-004', price: 15000, cost: 6000, categoryId: minuman.id },
    }),
    prisma.product.create({
      data: { name: 'Air Mineral', sku: 'MNM-005', price: 5000, cost: 2000, categoryId: minuman.id },
    }),

    // Snack
    prisma.product.create({
      data: { name: 'Kentang Goreng', sku: 'SNK-001', price: 15000, cost: 6000, categoryId: snack.id, trackStock: true, stock: 50 },
    }),
    prisma.product.create({
      data: { name: 'Chicken Wings (6 pcs)', sku: 'SNK-002', price: 25000, cost: 12000, categoryId: snack.id, trackStock: true, stock: 30 },
    }),
    prisma.product.create({
      data: { name: 'Onion Rings', sku: 'SNK-003', price: 12000, cost: 5000, categoryId: snack.id, trackStock: true, stock: 40 },
    }),

    // Dessert
    prisma.product.create({
      data: { name: 'Es Krim Vanilla', sku: 'DST-001', price: 12000, cost: 4000, categoryId: dessert.id },
    }),
    prisma.product.create({
      data: { name: 'Pisang Goreng Keju', sku: 'DST-002', price: 18000, cost: 7000, categoryId: dessert.id },
    }),
  ])
  console.log(`✓ Created ${products.length} products`)

  console.log('\n✅ Seeding completed!')
  console.log('\nDefault login:')
  console.log('  Admin: admin@restoman.com / admin123')
  console.log('  Kasir: kasir@restoman.com / kasir123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
