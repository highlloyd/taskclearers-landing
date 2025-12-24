import { NextRequest, NextResponse } from 'next/server';
import { db, jobs } from '@/lib/db';
import { eq, sql } from 'drizzle-orm';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    // Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);

    // Validate and clamp values
    const limit = Math.min(Math.max(1, limitParam), MAX_LIMIT);
    const offset = Math.max(0, offsetParam);

    const activeJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        department: jobs.department,
        description: jobs.description,
      })
      .from(jobs)
      .where(eq(jobs.isActive, true))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobs)
      .where(eq(jobs.isActive, true));

    return NextResponse.json({
      data: activeJobs,
      pagination: {
        limit,
        offset,
        total: countResult.count,
        hasMore: offset + activeJobs.length < countResult.count,
      },
    });
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
