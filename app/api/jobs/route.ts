import { NextResponse } from 'next/server';
import { db, jobs } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const activeJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        department: jobs.department,
        description: jobs.description,
      })
      .from(jobs)
      .where(eq(jobs.isActive, true));

    return NextResponse.json(activeJobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
