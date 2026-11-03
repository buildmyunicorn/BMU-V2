# ============================================================
# Build My Unicorn (BMU) 2.0 — Google Cloud Run Dockerfile
# ============================================================
FROM node:22-bookworm-slim AS base

# 1. Install dependencies
FROM base AS deps
WORKDIR /app

# Force IPv4 in Node to prevent dual-stack IPv6 DNS hangs in container networks
ENV NODE_OPTIONS="--no-network-family-autoselection"

COPY package.json package-lock.json* ./
RUN npm ci

# 2. Build the Next.js Standalone application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Production Runner for Google Cloud Run (PORT=8080)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 -g nodejs nextjs

# Copy public assets and standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
