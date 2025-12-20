import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/taskclearers.db';

// Lazy initialization to avoid database connection during Next.js build
let _db: BetterSQLite3Database<typeof schema> | null = null;

function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) {
    // Ensure the data directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const sqlite = new Database(dbPath);
    sqlite.pragma('journal_mode = WAL');
    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

// Export a proxy that lazily initializes the database
export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof BetterSQLite3Database<typeof schema>];
  },
});

export * from './schema';
