# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate .nuxt types first (required by prisma generate), then build
RUN npx nuxt prepare
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Override APP_PORT at build time:  docker build --build-arg APP_PORT=8080 .
# Override PORT at runtime via Coolify env var: PORT=8080 (no rebuild needed)
ARG APP_PORT=3000
ENV PORT=$APP_PORT

# Self-contained Nitro app bundle
COPY --from=builder /app/.output /app/.output

# Prisma: copy full node_modules from builder (preserves symlinks & wasm files)
COPY --from=builder /app/node_modules /app/node_modules

# Prisma migration artifacts
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/prisma.config.ts /app/prisma.config.ts

# Persistent volume for uploaded images (configure in Coolify: /app/.output/public/uploads)
VOLUME ["/app/.output/public/uploads"]

EXPOSE $APP_PORT

# Copy seed script + tsconfig (needed by tsx at runtime)
COPY --from=builder /app/prisma/seed.ts /app/prisma/seed.ts
COPY --from=builder /app/prisma/tsconfig.json /app/prisma/tsconfig.json
COPY --from=builder /app/tsconfig.json /app/tsconfig.json
COPY --from=builder /app/app/generated /app/app/generated
COPY --from=builder /app/node_modules/.bin/tsx /app/node_modules/.bin/tsx
COPY --from=builder /app/node_modules/tsx /app/node_modules/tsx

# Run migrations, seed initial data (skipped if already seeded), then start
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node .output/server/index.mjs"]
