import { NextRequest, NextResponse } from 'next/server';
import { db, emailTemplates, applications, jobs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { renderEmailTemplate, getTemplateData } from '@/lib/email/templates';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';

// POST /api/admin/email-templates/preview - Render template with application data
export async function POST(request: NextRequest) {
  const { error } = await requirePermission(PERMISSIONS.SEND_EMAILS);
  if (error) return error;

  try {
    const body = await request.json();
    const { templateId, applicationId, subject, body: templateBody } = body;

    // Either templateId or subject+body must be provided
    let templateSubject: string;
    let templateBodyContent: string;

    if (templateId) {
      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, templateId))
        .limit(1);

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      templateSubject = template.subject;
      templateBodyContent = template.body;
    } else if (subject && templateBody) {
      templateSubject = subject;
      templateBodyContent = templateBody;
    } else {
      return NextResponse.json(
        { error: 'Either templateId or subject+body are required' },
        { status: 400 }
      );
    }

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
    }

    // Fetch application and job data
    const [application] = await db
      .select({
        firstName: applications.firstName,
        lastName: applications.lastName,
        email: applications.email,
        createdAt: applications.createdAt,
        jobTitle: jobs.title,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const templateData = getTemplateData(
      { firstName: application.firstName, lastName: application.lastName, createdAt: application.createdAt },
      application.jobTitle || 'Unknown Position'
    );

    const rendered = renderEmailTemplate(
      { subject: templateSubject, body: templateBodyContent },
      templateData
    );

    return NextResponse.json({
      subject: rendered.subject,
      body: rendered.body,
      recipientEmail: application.email,
      recipientName: `${application.firstName} ${application.lastName}`,
    });
  } catch (error) {
    console.error('Failed to preview email template:', error);
    return NextResponse.json({ error: 'Failed to preview template' }, { status: 500 });
  }
}
