import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { db, salesLeadSentEmails, salesLeads, adminUsers, emailTemplates } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logSalesLeadActivity } from '@/lib/db/sales-lead-activity-logger';
import { sendEmail, getDefaultIdentity } from '@/lib/email/microsoft-graph';
import { eq, desc } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_SALES_LEADS);
  if (error) return error;

  try {
    const { id } = await context.params;

    const emails = await db
      .select({
        id: salesLeadSentEmails.id,
        recipientEmail: salesLeadSentEmails.recipientEmail,
        subject: salesLeadSentEmails.subject,
        body: salesLeadSentEmails.body,
        status: salesLeadSentEmails.status,
        errorMessage: salesLeadSentEmails.errorMessage,
        sentAt: salesLeadSentEmails.sentAt,
        createdAt: salesLeadSentEmails.createdAt,
        adminName: adminUsers.name,
        adminEmail: adminUsers.email,
        templateName: emailTemplates.name,
      })
      .from(salesLeadSentEmails)
      .leftJoin(adminUsers, eq(salesLeadSentEmails.adminUserId, adminUsers.id))
      .leftJoin(emailTemplates, eq(salesLeadSentEmails.templateId, emailTemplates.id))
      .where(eq(salesLeadSentEmails.leadId, id))
      .orderBy(desc(salesLeadSentEmails.createdAt));

    return NextResponse.json(emails);
  } catch (err) {
    console.error('Failed to fetch emails:', err);
    return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
  }
}

export async function POST(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.SEND_EMAILS);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { templateId, subject, body: emailBody, from } = body;

    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    // Get lead details
    const [lead] = await db
      .select({
        id: salesLeads.id,
        companyName: salesLeads.companyName,
        contactName: salesLeads.contactName,
        contactEmail: salesLeads.contactEmail,
      })
      .from(salesLeads)
      .where(eq(salesLeads.id, id))
      .limit(1);

    if (!lead) {
      return NextResponse.json({ error: 'Sales lead not found' }, { status: 404 });
    }

    // Replace placeholders in subject and body
    const placeholders: Record<string, string> = {
      '{{contact_name}}': lead.contactName,
      '{{company_name}}': lead.companyName,
      '{{company}}': 'TaskClearers',
    };

    let renderedSubject = subject;
    let renderedBody = emailBody;

    for (const [placeholder, value] of Object.entries(placeholders)) {
      renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), value);
      renderedBody = renderedBody.replace(new RegExp(placeholder, 'g'), value);
    }

    // Create email record
    const emailId = nanoid();
    await db.insert(salesLeadSentEmails).values({
      id: emailId,
      leadId: id,
      adminUserId: session!.user.id,
      templateId: templateId || null,
      recipientEmail: lead.contactEmail,
      subject: renderedSubject,
      body: renderedBody,
      status: 'pending',
    });

    // Determine which email identity to use (sales for sales leads)
    const fromEmail = from || getDefaultIdentity('sales')?.email;

    // Try to send the email
    let messageId: string | null = null;
    let sendError: string | null = null;

    try {
      const result = await sendEmail({
        to: lead.contactEmail,
        subject: renderedSubject,
        body: renderedBody,
        from: fromEmail,
      });
      messageId = result.messageId || null;
    } catch (err) {
      console.error('Failed to send email:', err);
      sendError = err instanceof Error ? err.message : 'Unknown error';
    }

    // Update email record with result
    await db.update(salesLeadSentEmails).set({
      status: sendError ? 'failed' : 'sent',
      messageId,
      errorMessage: sendError,
      sentAt: sendError ? null : new Date(),
    }).where(eq(salesLeadSentEmails.id, emailId));

    await logSalesLeadActivity({
      leadId: id,
      adminUserId: session!.user.id,
      action: 'email_sent',
      metadata: {
        emailId,
        subject: renderedSubject,
        status: sendError ? 'failed' : 'sent',
      },
    });

    revalidatePath(`/admin/sales-leads/${id}`);

    if (sendError) {
      return NextResponse.json({
        success: false,
        emailId,
        error: sendError
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId, messageId });
  } catch (err) {
    console.error('Failed to send email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
