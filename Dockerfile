FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Required for better-sqlite3 native module compilation
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production dependencies only (for migrations)
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Production image - minimal and secure
FROM base AS runner
WORKDIR /app

# Only libc6-compat needed for better-sqlite3 native module at runtime
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user with fixed UID/GID matching host volume ownership
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy pre-generated migrations
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

# Copy production dependencies for migrations (drizzle-orm, better-sqlite3)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Copy migration script and entrypoint
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs ./scripts/
COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh ./

# Run as non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/taskclearers.db

# Health check using the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["/bin/sh", "/app/docker-entrypoint.sh"]
