import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db, sentEmails, receivedEmails, applications, jobs, adminUsers, emailTemplates } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { eq } from 'drizzle-orm';
import { sendEmail, getDefaultIdentity } from '@/lib/email/microsoft-graph';
import { renderEmailTemplate, getTemplateData } from '@/lib/email/templates';

interface Context {
  params: Promise<{ id: string }>;
}

// GET /api/admin/applications/[id]/emails - Fetch email history for application (sent + received)
export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_APPLICATIONS);
  if (error) return error;

  try {
    const { id } = await context.params;

    // Fetch sent emails
    const sent = await db
      .select({
        id: sentEmails.id,
        recipientEmail: sentEmails.recipientEmail,
        subject: sentEmails.subject,
        body: sentEmails.body,
        status: sentEmails.status,
        errorMessage: sentEmails.errorMessage,
        sentAt: sentEmails.sentAt,
        createdAt: sentEmails.createdAt,
        adminName: adminUsers.name,
        adminEmail: adminUsers.email,
        templateName: emailTemplates.name,
      })
      .from(sentEmails)
      .leftJoin(adminUsers, eq(sentEmails.adminUserId, adminUsers.id))
      .leftJoin(emailTemplates, eq(sentEmails.templateId, emailTemplates.id))
      .where(eq(sentEmails.applicationId, id));

    // Fetch received emails
    const received = await db
      .select({
        id: receivedEmails.id,
        fromEmail: receivedEmails.fromEmail,
        fromName: receivedEmails.fromName,
        subject: receivedEmails.subject,
        body: receivedEmails.body,
        bodyPreview: receivedEmails.bodyPreview,
        receivedAt: receivedEmails.receivedAt,
        isRead: receivedEmails.isRead,
        createdAt: receivedEmails.createdAt,
      })
      .from(receivedEmails)
      .where(eq(receivedEmails.applicationId, id));

    // Combine and sort by timestamp
    const combined = [
      ...sent.map((e) => ({
        id: e.id,
        type: 'sent' as const,
        subject: e.subject,
        body: e.body,
        status: e.status,
        errorMessage: e.errorMessage,
        adminName: e.adminName,
        adminEmail: e.adminEmail,
        templateName: e.templateName,
        timestamp: e.sentAt || e.createdAt,
      })),
      ...received.map((e) => ({
        id: e.id,
        type: 'received' as const,
        fromEmail: e.fromEmail,
        fromName: e.fromName,
        subject: e.subject,
        body: e.body,
        bodyPreview: e.bodyPreview,
        isRead: e.isRead,
        timestamp: e.receivedAt,
      })),
    ].sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime; // Most recent first
    });

    return NextResponse.json(combined);
  } catch (error) {
    console.error('Failed to fetch emails:', error);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

// POST /api/admin/applications/[id]/emails - Send email to applicant
export async function POST(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.SEND_EMAILS);
  if (error) return error;

  try {
    const { id: applicationId } = await context.params;
    const body = await request.json();
    const { templateId, subject, body: emailBody, from } = body;

    if (!subject || !emailBody) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      );
    }

    // Fetch application and job data
    const [application] = await db
      .select({
        id: applications.id,
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

    // Render the email with placeholders
    const templateData = getTemplateData(
      { firstName: application.firstName, lastName: application.lastName, createdAt: application.createdAt },
      application.jobTitle || 'Unknown Position'
    );

    const rendered = renderEmailTemplate({ subject, body: emailBody }, templateData);

    // Create sent email record
    const emailId = nanoid();
    const now = new Date();

    await db.insert(sentEmails).values({
      id: emailId,
      applicationId,
      adminUserId: session!.user.id,
      templateId: templateId || null,
      recipientEmail: application.email,
      subject: rendered.subject,
      body: rendered.body,
      status: 'pending',
      createdAt: now,
    });

    // Determine which email identity to use
    const fromEmail = from || getDefaultIdentity('hiring')?.email;

    // Send the email
    try {
      const result = await sendEmail({
        to: application.email,
        subject: rendered.subject,
        body: rendered.body,
        from: fromEmail,
      });

      // Update email status to sent
      await db
        .update(sentEmails)
        .set({
          status: result.sent ? 'sent' : 'sent', // Even dev mode is "sent" for UX
          messageId: result.messageId,
          sentAt: new Date(),
        })
        .where(eq(sentEmails.id, emailId));

      return NextResponse.json({
        success: true,
        emailId,
        messageId: result.messageId,
        devMode: !result.sent,
        from: result.from,
      });
    } catch (sendError) {
      // Update email status to failed
      const errorMessage = sendError instanceof Error ? sendError.message : 'Unknown error';

      await db
        .update(sentEmails)
        .set({
          status: 'failed',
          errorMessage,
        })
        .where(eq(sentEmails.id, emailId));

      console.error('Failed to send email:', sendError);
      return NextResponse.json(
        { error: 'Failed to send email', details: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to process email request:', error);
    return NextResponse.json({ error: 'Failed to process email request' }, { status: 500 });
  }
}
