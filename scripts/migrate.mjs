#!/usr/bin/env node
/**
 * Database migration script using drizzle-orm's built-in migrator.
 * This replaces the need for drizzle-kit at runtime.
 *
 * Usage: node scripts/migrate.mjs
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || './data/taskclearers.db';
const migrationsFolder = path.join(__dirname, '..', 'drizzle');

console.log('[migrate] Database path:', dbPath);
console.log('[migrate] Migrations folder:', migrationsFolder);

// Ensure the data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  console.log('[migrate] Creating database directory:', dbDir);
  fs.mkdirSync(dbDir, { recursive: true });
}

// Check if migrations folder exists
if (!fs.existsSync(migrationsFolder)) {
  console.error('[migrate] ERROR: Migrations folder not found:', migrationsFolder);
  process.exit(1);
}

try {
  console.log('[migrate] Opening database...');
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite);

  console.log('[migrate] Applying migrations...');
  migrate(db, { migrationsFolder });

  console.log('[migrate] Migrations applied successfully');

  sqlite.close();
  process.exit(0);
} catch (error) {
  console.error('[migrate] ERROR:', error.message);
  process.exit(1);
}
