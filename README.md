# RestoMan

Point of Sale (POS) system untuk restoran, seperti Majoo, Moka, atau Olsera. Dibangun dengan Nuxt 3, Prisma 7, PostgreSQL, DaisyUI 5, dan Tailwind CSS v4.

## Fitur

- **Kasir (POS)** — Interface kasir dengan grid produk dan keranjang
- **Manajemen Order** — Riwayat order, pembayaran tunai/non-tunai
- **Produk & Kategori** — Kelola menu dengan stok tracking
- **Pengeluaran** — Catat biaya operasional
- **Dashboard** — Ringkasan penjualan dan laba harian
- **Multi-user** — Login dengan role Admin/Kasir

## Tech Stack

- Nuxt 3.21+ (compatibilityVersion 4)
- Prisma 7 dengan PostgreSQL
- Tailwind CSS v4 + DaisyUI 5
- @tabler/icons-vue

## Setup

```bash
# Install dependencies
npm install

# Setup database (edit .env first)
npx prisma migrate dev
npx prisma generate

# Seed sample data
npm run db:seed

# Run development server
npm run dev
```

## Environment (.env)

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/restoman?schema=public"
NUXT_AUTH_EMAIL="admin@restoman.com"
NUXT_AUTH_PASSWORD="admin123"
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run db:migrate   # Run migrations
npm run db:generate  # Generate Prisma client
npm run db:seed      # Seed database
```
