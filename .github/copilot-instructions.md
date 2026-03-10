# RestoMan – Copilot Instructions

## Project Overview
Point of Sale (POS) system for restaurants built with **Nuxt 3** (compatibility version 4), **Prisma 7**, **DaisyUI 5**, **Tailwind CSS v4**, and **PostgreSQL**.

## Tech Stack
- **Framework**: Nuxt 3.21+ with `future.compatibilityVersion: 4` — app files live in `app/` directory
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config.ts`). Theme configured via `@plugin "daisyui/theme"` in `app/assets/css/main.css`
- **UI Library**: DaisyUI 5 — custom theme named `"restoman"`, `data-theme` set on `<html>` via `useHead()`
- **Database ORM**: Prisma 7 with `prisma-client` generator (not `prisma-client-js`). Output: `app/generated/prisma`
- **DB Adapter**: `@prisma/adapter-pg` — required for Prisma 7, initialized in `server/utils/prisma.ts`
- **Icons**: `@tabler/icons-vue` — always import individually e.g. `import { IconPlus } from '@tabler/icons-vue'`
- **Auth**: Cookie-based session (`mm_session` stores user ID), `bcryptjs` for password hashing

## Key Conventions

### File Structure (Nuxt 4 compat)
- Pages: `app/pages/`
- Layouts: `app/layouts/`
- Components: `app/components/`
- Composables: `app/composables/`
- Middleware: `app/middleware/`
- Types: `app/types/index.ts`
- Assets/CSS: `app/assets/css/main.css`
- Server API: `server/api/`
- Server utils: `server/utils/`

### Alias Resolution
- `~` and `@` resolve to `app/` (not root) due to Nuxt 4 compat mode
- Server files must use **relative imports**: `../../utils/prisma`, `../../app/generated/prisma/client`

### Prisma 7 Rules
- No `url` field in `datasource db` block in schema.prisma — URL comes from `prisma.config.ts`
- Always use `prisma-client` generator (not `prisma-client-js`)
- After schema changes: run `npx prisma migrate dev --name <name>` then `npx prisma generate`
- Seed script: `npm run db:seed` (uses `tsx`)

### Nuxt / Nitro Rules
- Use `useRuntimeConfig()` in server routes — never `process.env` directly
- Runtime config keys use camelCase; env vars use `NUXT_` prefix (e.g. `NUXT_AUTH_EMAIL` → `runtimeConfig.authEmail`)
- Use `import.meta.dev` instead of `process.env.NODE_ENV === 'development'`
- `createError()` uses `statusMessage` not `message`

### UI / Styling Rules
- **Corporate style**: no rounded corners (`--radius-field: 0.25rem`), no animations, no depth/noise
- **Colors**: primary = dark green `oklch(30.6% 0.084 153)`, secondary = golden yellow `oklch(66.6% 0.162 80)`, base = white
- **Page layout pattern**: header with title + subtitle + action button, bordered card (`border border-base-300`), table or grid content, empty state with icon
- **Forms in modals**: always use `<fieldset class="fieldset">` with `<legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">`
- **Buttons**: `btn-sm` in modals and headers, `btn-primary` for main actions, `btn-ghost` for cancel
- **Badges**: use `badge-soft` variant (e.g. `badge-soft badge-success`)
- **Modal close**: `<button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3">` with `IconX`
- **Modal backdrop**: always include `<form method="dialog" class="modal-backdrop" @click="showModal = false"><button>close</button></form>`

### TypeScript
- All interfaces defined in `app/types/index.ts`
- Import with `import type { ... } from '~/types'`
- Always type `useFetch<T>()` generically
- Use `as any` cast only for Vite plugin type conflicts in `nuxt.config.ts`

### Auth
- Global middleware at `app/middleware/auth.global.ts` — protects all routes except `/login`
- Session cookie `mm_session` is `httpOnly`, stores user ID (cuid)
- `useAuth()` composable: `user` (useState), `isLoggedIn`, `fetchUser()`, `logout()`
- Call `auth.fetchUser()` in `onMounted()` in default layout

## Database Models

### Core Models
- `User` — id, name, email (unique), password (bcrypt hashed), role (ADMIN/CASHIER), isActive
- `Category` — id, name, icon, color, sortOrder, isActive
- `Product` — id, name, sku, description, price, cost, image, stock, trackStock, isActive, categoryId
- `Order` — orderNumber (ORD-YYYYMMDD-XXXX), status (PENDING/COMPLETED/CANCELLED), orderType (DINE_IN/TAKEAWAY), tableNumber, subtotal, discountAmount, taxAmount, totalAmount, paymentMethod, paidAmount, changeAmount, paidAt, cashierId
- `OrderItem` — quantity, unitPrice, subtotal, notes, orderId, productId
- `Expense` — description, amount, category, date

### Enums
- `UserRole`: ADMIN, CASHIER
- `OrderStatus`: PENDING, COMPLETED, CANCELLED
- `OrderType`: DINE_IN, TAKEAWAY
- `PaymentMethod`: CASH, DEBIT, CREDIT_CARD, EWALLET, QRIS

## Environment Variables (.env)
```
DATABASE_URL="postgresql://user:pass@host:5432/restoman?schema=public"
NUXT_AUTH_EMAIL="admin@restoman.com"
NUXT_AUTH_PASSWORD="admin123"
```

## Main Pages
- `/` — Dashboard (today's sales, orders, expenses, net income)
- `/pos` — POS cashier interface (product grid + cart)
- `/orders` — Order history
- `/products` — Product management
- `/categories` — Category management
- `/expenses` — Expense tracking
- `/login` — Authentication
