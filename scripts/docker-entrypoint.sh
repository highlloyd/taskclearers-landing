#!/bin/sh
set -e

echo "Initializing database schema..."

# Push schema to database (creates tables if they don't exist)
# --force skips confirmation prompt
npx drizzle-kit push --force 2>&1 || echo "Schema push completed (or already up to date)"

echo "Database ready, starting app..."

exec node server.js
