# syntax=docker/dockerfile:1
FROM node:22-alpine3.19 AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ─────────────────────────────────────────────
# deps — install ALL dependencies (incl. dev)
# ─────────────────────────────────────────────
FROM base AS deps
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
RUN --mount=type=cache,target=/root/.npm \
  npm install --prefer-offline --no-audit --no-fund --workspaces

# ─────────────────────────────────────────────
# builder — compile Next.js + bundle DB scripts
# ─────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

COPY turbo.json ./

# Source: Next.js app
COPY apps/web ./apps/web

# Source: database package (resolved at build by workspace symlink)
COPY packages/database/src ./packages/database/src
COPY packages/database/package.json ./packages/database/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_OUTPUT_STANDALONE=true

RUN npm run build -w apps/web

# Bundle DB scripts for runner stage (standalone .js files)
# Use --format=cjs because pg uses internal require() calls that break in pure ESM
RUN mkdir -p apps/web/dist-scripts && \
  ./node_modules/.bin/esbuild packages/database/src/db/migrate.ts --bundle --platform=node --outfile=apps/web/dist-scripts/migrate.cjs --format=cjs --external:pg-native && \
  ./node_modules/.bin/esbuild packages/database/src/db/seed.ts --bundle --platform=node --outfile=apps/web/dist-scripts/seed.cjs --format=cjs --external:pg-native && \
  cp packages/database/src/db/schema.sql apps/web/dist-scripts/

# Remove dev dependencies so runner image stays lean
RUN npm prune --omit=dev --no-audit --no-fund --workspaces

# ─────────────────────────────────────────────
# runner — production image
# ─────────────────────────────────────────────
FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# netcat-openbsd is needed by docker-entrypoint.sh to wait for PostgreSQL
RUN apk add --no-cache netcat-openbsd

RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public

RUN mkdir -p .next && chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

# Create symlink so server.js in apps/web can find static files
RUN mkdir -p apps/web/.next && ln -s /app/.next/static apps/web/.next/static

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/dist-scripts ./db-scripts

# Standalone output doesn't bundle node_modules in monorepo workspaces.
# Copy pruned node_modules and the workspace package the symlink points to.
COPY --from=builder --chown=nextjs:nodejs /app/packages/database ./packages/database
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Entrypoint that waits for DB and runs migrations before starting the app
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
