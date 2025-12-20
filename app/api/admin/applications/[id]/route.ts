import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db, applications } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { eq } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_APPLICATIONS);
  if (error) return error;

  try {
    const { id } = await context.params;

    const [application] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Failed to fetch application:', error);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.MANAGE_APPLICATIONS);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    await db
      .update(applications)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id));

    // Revalidate cached pages to show updated status
    revalidatePath('/admin/applications');
    revalidatePath(`/admin/applications/${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
