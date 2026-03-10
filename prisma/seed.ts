import { PrismaClient } from '../app/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // ===== Permissions =====
  const permissionDefs = [
    { code: 'pos.create_order', name: 'Buat Order', module: 'pos' },
    { code: 'pos.pay_order', name: 'Bayar Order', module: 'pos' },
    { code: 'pos.cancel_order', name: 'Batalkan Order', module: 'pos' },
    { code: 'pos.open_shift', name: 'Buka Shift', module: 'pos' },
    { code: 'pos.close_shift', name: 'Tutup Shift', module: 'pos' },
    { code: 'pos.split_bill', name: 'Split Bill', module: 'pos' },
    { code: 'pos.move_table', name: 'Pindah Meja', module: 'pos' },
    { code: 'pos.move_items', name: 'Pindah Item', module: 'pos' },
    { code: 'pos.pre_print', name: 'Pre-Print Bill', module: 'pos' },
    { code: 'products.view', name: 'Lihat Produk', module: 'products' },
    { code: 'products.create', name: 'Buat Produk', module: 'products' },
    { code: 'products.edit', name: 'Edit Produk', module: 'products' },
    { code: 'products.delete', name: 'Hapus Produk', module: 'products' },
    { code: 'categories.view', name: 'Lihat Kategori', module: 'categories' },
    { code: 'categories.create', name: 'Buat Kategori', module: 'categories' },
    { code: 'categories.edit', name: 'Edit Kategori', module: 'categories' },
    { code: 'categories.delete', name: 'Hapus Kategori', module: 'categories' },
    { code: 'orders.view', name: 'Lihat Order', module: 'orders' },
    { code: 'expenses.view', name: 'Lihat Pengeluaran', module: 'expenses' },
    { code: 'expenses.create', name: 'Buat Pengeluaran', module: 'expenses' },
    { code: 'expenses.edit', name: 'Edit Pengeluaran', module: 'expenses' },
    { code: 'expenses.delete', name: 'Hapus Pengeluaran', module: 'expenses' },
    { code: 'settings.view', name: 'Lihat Pengaturan', module: 'settings' },
    { code: 'settings.edit', name: 'Edit Pengaturan', module: 'settings' },
    { code: 'dashboard.view', name: 'Lihat Dashboard', module: 'dashboard' },
  ]

  const permissions = await Promise.all(
    permissionDefs.map(p =>
      prisma.permission.upsert({
        where: { code: p.code },
        update: { name: p.name, module: p.module },
        create: p,
      })
    )
  )
  console.log(`✓ ${permissions.length} permissions`)

  // ===== Tenant =====
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'restoman-demo' },
    update: {},
    create: { name: 'RestoMan Demo', slug: 'restoman-demo' },
  })
  console.log(`✓ Tenant: ${tenant.name}`)

  // ===== Locations =====
  const location1 = await prisma.location.create({
    data: { name: 'Cabang Pusat', address: 'Jl. Sudirman No. 1', phone: '021-1234567', tenantId: tenant.id },
  })
  const location2 = await prisma.location.create({
    data: { name: 'Cabang Mall', address: 'Mall Grand Indonesia Lt. 3', phone: '021-7654321', tenantId: tenant.id },
  })
  console.log(`✓ 2 locations created`)

  // ===== Roles =====
  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Administrator with full access',
      isSystem: true,
      tenantId: tenant.id,
      permissions: {
        create: permissions.map(p => ({ permissionId: p.id })),
      },
    },
  })

  // Cashier gets a subset of permissions
  const cashierPermCodes = [
    'pos.create_order', 'pos.pay_order', 'pos.open_shift', 'pos.close_shift',
    'pos.split_bill', 'pos.move_table', 'pos.move_items', 'pos.pre_print',
    'products.view', 'categories.view', 'orders.view', 'dashboard.view',
  ]
  const cashierPerms = permissions.filter(p => cashierPermCodes.includes(p.code))

  const cashierRole = await prisma.role.create({
    data: {
      name: 'CASHIER',
      description: 'Kasir dengan akses POS',
      isSystem: true,
      tenantId: tenant.id,
      permissions: {
        create: cashierPerms.map(p => ({ permissionId: p.id })),
      },
    },
  })
  console.log(`✓ Roles: ADMIN (${permissions.length} perms), CASHIER (${cashierPerms.length} perms)`)

  // ===== Users =====
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@restoman.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@restoman.com',
      password: adminPassword,
      tenantId: tenant.id,
      roleId: adminRole.id,
    },
  })
  console.log(`✓ Admin user: ${admin.email}`)

  const cashierPassword = await hash('kasir123', 12)
  const cashier = await prisma.user.upsert({
    where: { email: 'kasir@restoman.com' },
    update: {},
    create: {
      name: 'Kasir 1',
      email: 'kasir@restoman.com',
      password: cashierPassword,
      tenantId: tenant.id,
      roleId: cashierRole.id,
    },
  })
  console.log(`✓ Cashier user: ${cashier.email}`)

  // ===== Default Settings for Location 1 =====
  const defaultSettings = [
    { key: 'tax.enabled', value: 'true', group: 'tax' },
    { key: 'tax.rate', value: '11', group: 'tax' },
    { key: 'tax.name', value: 'PPN', group: 'tax' },
    { key: 'tax.inclusive', value: 'false', group: 'tax' },
    { key: 'service.enabled', value: 'true', group: 'service' },
    { key: 'service.rate', value: '5', group: 'service' },
    { key: 'service.name', value: 'Service Charge', group: 'service' },
    { key: 'payment.methods', value: '["CASH","DEBIT","CREDIT_CARD","EWALLET","QRIS"]', group: 'payment' },
    { key: 'order.mode', value: 'all', group: 'order' },
    { key: 'order.requireTable', value: 'true', group: 'order' },
  ]

  await Promise.all(
    defaultSettings.map(s =>
      prisma.setting.create({ data: { ...s, locationId: location1.id } })
    )
  )
  console.log(`✓ ${defaultSettings.length} settings for ${location1.name}`)

  // ===== Categories =====
  const categories = await Promise.all([
    prisma.category.create({
      data: { name: 'Makanan', icon: '🍔', color: '#ef4444', sortOrder: 1, tenantId: tenant.id },
    }),
    prisma.category.create({
      data: { name: 'Minuman', icon: '🥤', color: '#3b82f6', sortOrder: 2, tenantId: tenant.id },
    }),
    prisma.category.create({
      data: { name: 'Snack', icon: '🍟', color: '#f59e0b', sortOrder: 3, tenantId: tenant.id },
    }),
    prisma.category.create({
      data: { name: 'Dessert', icon: '🍰', color: '#ec4899', sortOrder: 4, tenantId: tenant.id },
    }),
  ])
  console.log(`✓ Created ${categories.length} categories`)

  const [makanan, minuman, snack, dessert] = categories

  // ===== Products =====
  const products = await Promise.all([
    // Makanan
    prisma.product.create({
      data: { name: 'Nasi Goreng Special', sku: 'MKN-001', price: 25000, cost: 12000, categoryId: makanan.id, tenantId: tenant.id },
    }),
    prisma.product.create({
      data: { name: 'Mie Goreng Seafood', sku: 'MKN-002', price: 28000, cost: 14000, categoryId: makanan.id, tenantId: tenant.id },
    }),
    prisma.product.create({
      data: { name: 'Ayam Bakar', sku: 'MKN-003', price: 35000, cost: 18000, categoryId: makanan.id, tenantId: tenant.id },
    }),
    prisma.product.create({
      data: { name: 'Sate Ayam (10 tusuk)', sku: 'MKN-004', price: 30000, cost: 15000, categoryId: makanan.id, tenantId: tenant.id },
    }),
    prisma.product.create({
      data: { name: 'Nasi Putih', sku: 'MKN-005', price: 5000, cost: 2000, categoryId: makanan.id, tenantId: tenant.id },
    }),

    // Minuman
    prisma.product.create({
      data: { name: 'Es Teh Manis', sku: 'MNM-001', price: 8000, cost: 2000, categoryId: minuman.id, tenantId: tenant.id },
    }),
    prisma.product.create({
      data: { name: 'Es Jeruk', sku: 'MNM-002', price: 10000, cost: 3000, categoryId: minuman.id, tenantId: tenant.id },
    }),
    prisma.product.create({
      data: { name: 'Kopi Hitam', sku: 'MNM-003', price: 8000, cost: 2500, categoryId: minuman.id, tenantId: tenant.id },
    }),
    prisma.product.create({
      data: { name: 'Jus Alpukat', sku: 'MNM-004', price: 15000, cost: 6000, categoryId: minuman.id, tenantId: tenant.id },
    }),
    prisma.product.create({
      data: { name: 'Air Mineral', sku: 'MNM-005', price: 5000, cost: 2000, categoryId: minuman.id, tenantId: tenant.id },
    }),

    // Snack
    prisma.product.create({
      data: { name: 'Kentang Goreng', sku: 'SNK-001', price: 15000, cost: 6000, categoryId: snack.id, tenantId: tenant.id, trackStock: true, stock: 50 },
    }),
    prisma.product.create({
      data: { name: 'Chicken Wings (6 pcs)', sku: 'SNK-002', price: 25000, cost: 12000, categoryId: snack.id, tenantId: tenant.id, trackStock: true, stock: 30 },
    }),
    prisma.product.create({
      data: { name: 'Onion Rings', sku: 'SNK-003', price: 12000, cost: 5000, categoryId: snack.id, tenantId: tenant.id, trackStock: true, stock: 40 },
    }),

    // Dessert
    prisma.product.create({
      data: { name: 'Es Krim Vanilla', sku: 'DST-001', price: 12000, cost: 4000, categoryId: dessert.id, tenantId: tenant.id },
    }),
    prisma.product.create({
      data: { name: 'Pisang Goreng Keju', sku: 'DST-002', price: 18000, cost: 7000, categoryId: dessert.id, tenantId: tenant.id },
    }),
  ])
  console.log(`✓ Created ${products.length} products`)

  console.log('\n✅ Seeding completed!')
  console.log('\nDefault login:')
  console.log('  Admin: admin@restoman.com / admin123')
  console.log('  Kasir: kasir@restoman.com / kasir123')
  console.log('\nLocations:')
  console.log(`  ${location1.name} (${location1.id})`)
  console.log(`  ${location2.name} (${location2.id})`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
