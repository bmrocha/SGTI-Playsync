#!/bin/sh
set -e

# ─────────────────────────────────────────────
# Docker Entrypoint for SGTI-Playsync
# Waits for DB, runs migrations, then starts app
# ─────────────────────────────────────────────

echo "⏳ Waiting for PostgreSQL to be ready..."

# Extract host from DATABASE_URL (e.g., playsync_db_player:5432)
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$DATABASE_URL" | sed -n 's|.*@.*:\([0-9]*\)/.*|\1|p')
DB_HOST="${DB_HOST:-playsync_db_player}"
DB_PORT="${DB_PORT:-5432}"

until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  echo "   DB not ready yet — retrying in 2s..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run migrations if the bundled script exists
if [ -f "./db-scripts/migrate.cjs" ]; then
  echo "🔄 Running database migrations..."
  node ./db-scripts/migrate.cjs || echo "⚠️  Migration failed (DB may already be initialized). Continuing..."
fi

# Run seed if the bundled script exists (optional)
if [ -f "./db-scripts/seed.cjs" ]; then
  echo "🌱 Running database seed..."
  node ./db-scripts/seed.cjs || echo "⚠️  Seed failed or already seeded. Continuing..."
fi

echo "🚀 Starting Next.js application..."
exec node apps/web/server.js
