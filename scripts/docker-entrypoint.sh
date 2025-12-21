#!/bin/sh
set -e

echo "[entrypoint] Starting TaskClearers..."
echo "[entrypoint] Running as: $(id)"
echo "[entrypoint] DATABASE_PATH=${DATABASE_PATH:-/app/data/taskclearers.db}"

# Verify data directory is writable
# This should be a pre-configured host volume with correct ownership (uid=1001)
DATA_DIR=$(dirname "${DATABASE_PATH:-/app/data/taskclearers.db}")

if [ ! -d "$DATA_DIR" ]; then
    echo "[entrypoint] ERROR: Data directory does not exist: $DATA_DIR"
    echo "[entrypoint] Ensure the host volume is mounted at /app/data"
    exit 1
fi

if [ ! -w "$DATA_DIR" ]; then
    echo "[entrypoint] ERROR: Data directory is not writable: $DATA_DIR"
    echo "[entrypoint] Ensure the host volume has correct ownership (uid=1001, gid=1001)"
    echo "[entrypoint] Run: chown 1001:1001 /path/to/data"
    exit 1
fi

# Apply database migrations using drizzle-orm migrator
echo "[entrypoint] Applying database migrations..."
if node /app/scripts/migrate.mjs; then
    echo "[entrypoint] Migrations complete"
else
    echo "[entrypoint] ERROR: Migration failed"
    exit 1
fi

# Start the application
echo "[entrypoint] Starting Next.js server..."
exec node server.js
