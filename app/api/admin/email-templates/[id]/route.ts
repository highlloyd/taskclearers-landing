import { NextRequest, NextResponse } from 'next/server';
import { db, emailTemplates } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/admin/email-templates/[id] - Get single template
export async function GET(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to fetch email template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PATCH /api/admin/email-templates/[id] - Update template
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, subject, body: templateBody, triggerStatus, isActive } = body;

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (templateBody !== undefined) updateData.body = templateBody;
    if (triggerStatus !== undefined) updateData.triggerStatus = triggerStatus;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db
      .update(emailTemplates)
      .set(updateData)
      .where(eq(emailTemplates.id, id));

    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to update email template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/admin/email-templates/[id] - Soft delete (deactivate)
export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    await db
      .update(emailTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete email template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
