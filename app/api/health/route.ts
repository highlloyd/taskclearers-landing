import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verify database is accessible
    const result = db.get(sql`SELECT 1 as ok`);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: result ? 'connected' : 'error',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
