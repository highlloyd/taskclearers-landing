import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { db, jobs } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { desc } from 'drizzle-orm';

export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.VIEW_JOBS);
  if (error) return error;

  try {
    const allJobs = await db
      .select()
      .from(jobs)
      .orderBy(desc(jobs.createdAt));

    return NextResponse.json(allJobs);
  } catch (err) {
    console.error('Failed to fetch jobs:', err);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error } = await requirePermission(PERMISSIONS.MANAGE_JOBS);
  if (error) return error;

  try {
    const body = await request.json();
    const { title, department, location, description, salaryRange, isActive } = body;

    if (!title || !department || !location || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const id = nanoid();
    await db.insert(jobs).values({
      id,
      title,
      department,
      location,
      description,
      salaryRange: salaryRange || null,
      isActive: isActive ?? true,
    });

    revalidatePath('/admin/jobs');
    revalidatePath('/careers');

    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('Failed to create job:', err);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
