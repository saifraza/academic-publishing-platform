# syntax=docker/dockerfile:1

# ---------------------------------------------------------------- deps
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# --------------------------------------------------------------- build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma needs a DATABASE_URL present at build time to generate the client.
# The real value is injected by Railway at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------- run
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The Prisma CLI pulls in a deep transitive tree (@prisma/config -> effect, ...),
# so cherry-picking directories into the runtime does not work. Give the
# migrator its own complete node_modules under /migrator instead, leaving the
# app's standalone runtime untouched and slim.
COPY --from=deps /app/node_modules /migrator/node_modules
COPY --from=builder /app/prisma /migrator/prisma

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
