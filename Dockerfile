FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Required for better-sqlite3 native module
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy drizzle config and schema for db:push at runtime
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/lib/db ./lib/db
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy entrypoint script
COPY --from=builder /app/scripts/docker-entrypoint.sh ./

# Create data directory for SQLite and uploads
RUN mkdir -p /app/data /app/data/uploads && chown -R nextjs:nodejs /app/data
RUN chown nextjs:nodejs /app/docker-entrypoint.sh && chmod 755 /app/docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_PATH=/app/data/taskclearers.db

CMD ["/app/docker-entrypoint.sh"]
