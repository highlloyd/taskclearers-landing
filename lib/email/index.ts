import { sendEmail, isGraphConfigured, getDefaultIdentity } from './microsoft-graph';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const adminIdentity = getDefaultIdentity('admin');

  // If no Graph API configured, log the code (for development only)
  if (!isGraphConfigured()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== Magic Code (Graph API not configured) ===');
      console.log(`Email: ${email}`);
      console.log(`Code: ${token}`);
      console.log('==============================================');
    } else {
      console.warn('WARNING: Graph API not configured. Magic link email could not be sent.');
    }
    return;
  }

  await sendEmail({
    from: adminIdentity?.email,
    fromName: adminIdentity?.name || 'TaskClearers Admin',
    to: email,
    subject: 'Your login code for TaskClearers Admin',
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">TaskClearers Admin</h1>
        <p>Use the code below to log in to your admin dashboard:</p>
        <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">${token}</span>
        </div>
        <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendNewApplicationNotification(
  jobTitle: string,
  applicantName: string,
  applicantEmail: string
): Promise<void> {
  const notificationEmail = process.env.NOTIFICATION_EMAIL;
  const adminIdentity = getDefaultIdentity('notification');

  if (!notificationEmail || !isGraphConfigured()) {
    console.log('=== New Application Notification ===');
    console.log(`Job: ${jobTitle}`);
    console.log(`Applicant: ${applicantName} (${applicantEmail})`);
    console.log('====================================');
    return;
  }

  await sendEmail({
    from: adminIdentity?.email,
    fromName: adminIdentity?.name || 'TaskClearers',
    to: notificationEmail,
    subject: `New application for ${jobTitle}`,
    body: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">New Job Application</h1>
        <p>A new application has been submitted:</p>
        <ul>
          <li><strong>Position:</strong> ${jobTitle}</li>
          <li><strong>Applicant:</strong> ${applicantName}</li>
          <li><strong>Email:</strong> ${applicantEmail}</li>
        </ul>
        <a href="${BASE_URL}/admin/applications" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          View Application
        </a>
      </div>
    `,
  });
}
