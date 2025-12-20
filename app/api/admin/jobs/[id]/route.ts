import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db, jobs } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { eq } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_JOBS);
  if (error) return error;

  try {
    const { id } = await context.params;

    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (err) {
    console.error('Failed to fetch job:', err);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.MANAGE_JOBS);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { title, department, location, description, salaryRange, isActive } = body;

    await db
      .update(jobs)
      .set({
        ...(title !== undefined && { title }),
        ...(department !== undefined && { department }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        ...(salaryRange !== undefined && { salaryRange }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, id));

    revalidatePath('/admin/jobs');
    revalidatePath(`/admin/jobs/${id}`);
    revalidatePath('/careers');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update job:', err);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.MANAGE_JOBS);
  if (error) return error;

  try {
    const { id } = await context.params;

    await db.delete(jobs).where(eq(jobs.id, id));

    revalidatePath('/admin/jobs');
    revalidatePath('/careers');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete job:', err);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
