import { NextRequest, NextResponse } from 'next/server';
import { db, emailTemplates } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';

// GET /api/admin/email-templates - List all active templates
export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.SEND_EMAILS);
  if (error) return error;

  try {
    const templates = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.isActive, true))
      .orderBy(emailTemplates.name);

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Failed to fetch email templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/admin/email-templates - Create new template
export async function POST(request: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.SEND_EMAILS);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, subject, body: templateBody, triggerStatus } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json(
        { error: 'Name, subject, and body are required' },
        { status: 400 }
      );
    }

    const id = nanoid();
    const now = new Date();

    await db.insert(emailTemplates).values({
      id,
      name,
      subject,
      body: templateBody,
      triggerStatus: triggerStatus || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.id, id))
      .limit(1);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Failed to create email template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
