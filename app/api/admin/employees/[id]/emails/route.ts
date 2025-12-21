import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { db, employeeSentEmails, employees, adminUsers, emailTemplates } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logEmployeeActivity } from '@/lib/db/activity-logger';
import { sendEmail, getDefaultIdentity } from '@/lib/email/microsoft-graph';
import { eq, desc } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;

    const emails = await db
      .select({
        id: employeeSentEmails.id,
        recipientEmail: employeeSentEmails.recipientEmail,
        subject: employeeSentEmails.subject,
        body: employeeSentEmails.body,
        status: employeeSentEmails.status,
        errorMessage: employeeSentEmails.errorMessage,
        sentAt: employeeSentEmails.sentAt,
        createdAt: employeeSentEmails.createdAt,
        adminName: adminUsers.name,
        adminEmail: adminUsers.email,
        templateName: emailTemplates.name,
      })
      .from(employeeSentEmails)
      .leftJoin(adminUsers, eq(employeeSentEmails.adminUserId, adminUsers.id))
      .leftJoin(emailTemplates, eq(employeeSentEmails.templateId, emailTemplates.id))
      .where(eq(employeeSentEmails.employeeId, id))
      .orderBy(desc(employeeSentEmails.createdAt));

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
    const { templateId, subject, body: emailBody, from, fromName } = body;

    if (!subject || !emailBody) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 });
    }

    // Get employee details
    const [employee] = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        department: employees.department,
        role: employees.role,
      })
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Replace placeholders in subject and body
    const placeholders: Record<string, string> = {
      '{{employee_name}}': `${employee.firstName} ${employee.lastName}`,
      '{{employee_first}}': employee.firstName,
      '{{employee_last}}': employee.lastName,
      '{{department}}': employee.department,
      '{{role}}': employee.role,
      '{{company_name}}': 'TaskClearers',
    };

    let renderedSubject = subject;
    let renderedBody = emailBody;

    for (const [placeholder, value] of Object.entries(placeholders)) {
      renderedSubject = renderedSubject.replace(new RegExp(placeholder, 'g'), value);
      renderedBody = renderedBody.replace(new RegExp(placeholder, 'g'), value);
    }

    // Create email record
    const emailId = nanoid();
    await db.insert(employeeSentEmails).values({
      id: emailId,
      employeeId: id,
      adminUserId: session!.user.id,
      templateId: templateId || null,
      recipientEmail: employee.email,
      subject: renderedSubject,
      body: renderedBody,
      status: 'pending',
    });

    // Determine which email identity to use (HR/admin emails for employees)
    const fromEmail = from || getDefaultIdentity('admin')?.email;
    // Use provided fromName, or fall back to the current user's name for personal emails
    const senderName = fromName || (from === session?.user.email ? session?.user.name : undefined);

    // Try to send the email
    let messageId: string | null = null;
    let sendError: string | null = null;

    try {
      const result = await sendEmail({
        to: employee.email,
        subject: renderedSubject,
        body: renderedBody,
        from: fromEmail,
        fromName: senderName,
      });
      messageId = result.messageId || null;
    } catch (err) {
      console.error('Failed to send email:', err);
      sendError = err instanceof Error ? err.message : 'Unknown error';
    }

    // Update email record with result
    await db.update(employeeSentEmails).set({
      status: sendError ? 'failed' : 'sent',
      messageId,
      errorMessage: sendError,
      sentAt: sendError ? null : new Date(),
    }).where(eq(employeeSentEmails.id, emailId));

    await logEmployeeActivity({
      employeeId: id,
      adminUserId: session!.user.id,
      action: 'email_sent',
      metadata: {
        emailId,
        subject: renderedSubject,
        status: sendError ? 'failed' : 'sent',
      },
    });

    revalidatePath(`/admin/employees/${id}`);

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
