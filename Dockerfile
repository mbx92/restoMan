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

# Generate Prisma client, then build Nuxt app
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Install all deps (includes prisma CLI from devDeps for running migrations)
COPY package*.json ./
RUN npm ci

# Self-contained Nitro app bundle
COPY --from=builder /app/.output /app/.output

# Prisma migration artifacts
COPY --from=builder /app/prisma /app/prisma
COPY --from=builder /app/prisma.config.ts /app/prisma.config.ts

# Persistent volume for uploaded images (configure in Coolify: /app/.output/public/uploads)
VOLUME ["/app/.output/public/uploads"]

EXPOSE 3000

# Run migrations then start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node .output/server/index.mjs"]
