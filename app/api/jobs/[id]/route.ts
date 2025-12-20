import { NextResponse } from 'next/server';
import { db, jobs } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  try {
    const { id } = await context.params;

    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.isActive, true)))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Increment view count
    await db
      .update(jobs)
      .set({ viewCount: job.viewCount + 1 })
      .where(eq(jobs.id, id));

    return NextResponse.json(job);
  } catch (error) {
    console.error('Failed to fetch job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}
