import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { db, applicationNotes } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { eq, desc } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_APPLICATIONS);
  if (error) return error;

  try {
    const { id } = await context.params;

    const notes = await db
      .select()
      .from(applicationNotes)
      .where(eq(applicationNotes.applicationId, id))
      .orderBy(desc(applicationNotes.createdAt));

    return NextResponse.json(notes);
  } catch (err) {
    console.error('Failed to fetch notes:', err);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_APPLICATIONS);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const noteId = nanoid();
    await db.insert(applicationNotes).values({
      id: noteId,
      applicationId: id,
      adminUserId: session!.user.id,
      content: content.trim(),
    });

    revalidatePath(`/admin/applications/${id}`);

    return NextResponse.json({ success: true, id: noteId });
  } catch (err) {
    console.error('Failed to create note:', err);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_APPLICATIONS);
  if (error) return error;

  try {
    const body = await request.json();
    const { noteId, content } = body;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Verify the note exists and belongs to the current admin
    const existingNote = await db
      .select()
      .from(applicationNotes)
      .where(eq(applicationNotes.id, noteId))
      .limit(1);

    if (existingNote.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (existingNote[0].adminUserId !== session!.user.id) {
      return NextResponse.json({ error: 'You can only edit your own notes' }, { status: 403 });
    }

    await db
      .update(applicationNotes)
      .set({ content: content.trim() })
      .where(eq(applicationNotes.id, noteId));

    revalidatePath(`/admin/applications/${existingNote[0].applicationId}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update note:', err);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_APPLICATIONS);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Verify the note exists and belongs to the current admin
    const existingNote = await db
      .select()
      .from(applicationNotes)
      .where(eq(applicationNotes.id, noteId))
      .limit(1);

    if (existingNote.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (existingNote[0].adminUserId !== session!.user.id) {
      return NextResponse.json({ error: 'You can only delete your own notes' }, { status: 403 });
    }

    await db
      .delete(applicationNotes)
      .where(eq(applicationNotes.id, noteId));

    revalidatePath(`/admin/applications/${existingNote[0].applicationId}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete note:', err);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
