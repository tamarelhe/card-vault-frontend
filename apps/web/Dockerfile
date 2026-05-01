FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ── Install dependencies ──────────────────────────────────────
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/core/package.json packages/core/
COPY packages/api/package.json packages/api/
COPY packages/validation/package.json packages/validation/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile

# ── Build ─────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Bring in installed node_modules (includes .pnpm store + workspace symlinks)
COPY --from=deps /app ./

# Copy source on top
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

ARG NEXT_PUBLIC_CARDVAULT_API_URL=https://api-card-vault.tamarelhe.xyz/api/v1
ENV NEXT_PUBLIC_CARDVAULT_API_URL=${NEXT_PUBLIC_CARDVAULT_API_URL}

WORKDIR /app/apps/web
RUN pnpm build

# ── Runner ────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone output lands at .next/standalone/ relative to outputFileTracingRoot (monorepo root)
# so server.js is at apps/web/server.js inside the standalone bundle
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
