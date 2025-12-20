import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { db, employeeNotes, adminUsers } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logEmployeeActivity } from '@/lib/db/activity-logger';
import { eq, desc } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;

    const notes = await db
      .select({
        id: employeeNotes.id,
        content: employeeNotes.content,
        category: employeeNotes.category,
        createdAt: employeeNotes.createdAt,
        updatedAt: employeeNotes.updatedAt,
        adminUserId: employeeNotes.adminUserId,
        adminName: adminUsers.name,
        adminEmail: adminUsers.email,
      })
      .from(employeeNotes)
      .leftJoin(adminUsers, eq(employeeNotes.adminUserId, adminUsers.id))
      .where(eq(employeeNotes.employeeId, id))
      .orderBy(desc(employeeNotes.createdAt));

    return NextResponse.json(notes);
  } catch (err) {
    console.error('Failed to fetch notes:', err);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { content, category = 'general' } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const validCategories = ['general', 'performance', 'feedback', 'hr'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const noteId = nanoid();
    await db.insert(employeeNotes).values({
      id: noteId,
      employeeId: id,
      adminUserId: session!.user.id,
      content: content.trim(),
      category,
    });

    await logEmployeeActivity({
      employeeId: id,
      adminUserId: session!.user.id,
      action: 'note_added',
      metadata: { category, noteId },
    });

    revalidatePath(`/admin/employees/${id}`);

    return NextResponse.json({ success: true, id: noteId });
  } catch (err) {
    console.error('Failed to create note:', err);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { noteId, content, category } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const [existingNote] = await db
      .select()
      .from(employeeNotes)
      .where(eq(employeeNotes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (existingNote.adminUserId !== session!.user.id) {
      return NextResponse.json({ error: 'You can only edit your own notes' }, { status: 403 });
    }

    const updates: { content: string; category?: string; updatedAt: Date } = {
      content: content.trim(),
      updatedAt: new Date(),
    };

    if (category) {
      const validCategories = ['general', 'performance', 'feedback', 'hr'];
      if (validCategories.includes(category)) {
        updates.category = category;
      }
    }

    await db
      .update(employeeNotes)
      .set(updates)
      .where(eq(employeeNotes.id, noteId));

    await logEmployeeActivity({
      employeeId: id,
      adminUserId: session!.user.id,
      action: 'note_updated',
      metadata: { noteId },
    });

    revalidatePath(`/admin/employees/${id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update note:', err);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const [existingNote] = await db
      .select()
      .from(employeeNotes)
      .where(eq(employeeNotes.id, noteId))
      .limit(1);

    if (!existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (existingNote.adminUserId !== session!.user.id) {
      return NextResponse.json({ error: 'You can only delete your own notes' }, { status: 403 });
    }

    await db.delete(employeeNotes).where(eq(employeeNotes.id, noteId));

    await logEmployeeActivity({
      employeeId: id,
      adminUserId: session!.user.id,
      action: 'note_deleted',
      metadata: { noteId },
    });

    revalidatePath(`/admin/employees/${id}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete note:', err);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
