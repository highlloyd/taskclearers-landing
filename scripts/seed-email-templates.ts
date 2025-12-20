import { db, emailTemplates } from '../lib/db';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';

const defaultTemplates = [
  {
    name: 'rejection',
    subject: 'Your Application to {{company_name}} - {{job_title}}',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
  <div style="border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 24px;">
    <h2 style="margin: 0; color: #16a34a; font-size: 24px; font-weight: 600;">{{company_name}}</h2>
  </div>

  <p style="margin-bottom: 16px;">Dear {{applicant_first}},</p>

  <p style="margin-bottom: 16px;">Thank you for your interest in the <strong>{{job_title}}</strong> position at {{company_name}} and for taking the time to share your experience with us.</p>

  <p style="margin-bottom: 16px;">After a thorough review of all applications, we have decided to proceed with candidates whose qualifications more closely align with the specific requirements of this role. Please know that this decision reflects only the unique needs of this particular position and not a reflection of your abilities or potential.</p>

  <p style="margin-bottom: 16px;">We genuinely appreciate the effort you put into your application. The job market is competitive, and we recognize the dedication it takes to present yourself professionally.</p>

  <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0; font-weight: 500;">Stay Connected</p>
    <p style="margin: 8px 0 0 0; font-size: 14px;">We encourage you to monitor our careers page for future opportunities that may be a better match for your skills and experience. Your resume will remain in our database for consideration.</p>
  </div>

  <p style="margin-bottom: 16px;">We wish you every success in your career search and future professional endeavors.</p>

  <p style="margin-bottom: 8px;">With best regards,</p>
  <p style="margin: 0; font-weight: 600;">The {{company_name}} Talent Team</p>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">This email was sent regarding your application submitted on {{application_date}}.</p>
  </div>
</div>`,
    triggerStatus: 'rejected',
  },
  {
    name: 'interview_invite',
    subject: 'Interview Invitation: {{job_title}} at {{company_name}}',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
  <div style="border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 24px;">
    <h2 style="margin: 0; color: #16a34a; font-size: 24px; font-weight: 600;">{{company_name}}</h2>
  </div>

  <p style="margin-bottom: 16px;">Dear {{applicant_first}},</p>

  <p style="margin-bottom: 16px;">We are pleased to inform you that your application for the <strong>{{job_title}}</strong> position has advanced to the interview stage. Your background and qualifications stood out among many impressive candidates, and we are excited to learn more about you.</p>

  <div style="background-color: #f0fdf4; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
    <p style="margin: 0 0 8px 0; font-weight: 600; color: #166534; font-size: 16px;">Ready to Take the Next Step?</p>
    <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 14px;">Select a time that works best with your schedule.</p>
    <a href="https://outlook.office.com/book/TaskClearers1@TaskClearers.com/" style="display: inline-block; background-color: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);">
      Schedule Your Interview
    </a>
  </div>

  <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0 0 12px 0; font-weight: 600; color: #374151;">What to Expect:</p>
    <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
      <li style="margin-bottom: 8px;">The interview will last approximately 30-45 minutes</li>
      <li style="margin-bottom: 8px;">We will discuss your experience and how it relates to the role</li>
      <li style="margin-bottom: 8px;">You will have the opportunity to ask questions about the position and our team</li>
      <li style="margin-bottom: 0;">Please have your resume accessible for reference</li>
    </ul>
  </div>

  <p style="margin-bottom: 16px;">If you have any questions prior to the interview or need to discuss alternative arrangements, please do not hesitate to reply to this email. We are happy to accommodate your needs.</p>

  <p style="margin-bottom: 16px;">We look forward to speaking with you soon.</p>

  <p style="margin-bottom: 8px;">Best regards,</p>
  <p style="margin: 0; font-weight: 600;">The {{company_name}} Hiring Team</p>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">Application submitted: {{application_date}} | Position: {{job_title}}</p>
  </div>
</div>`,
    triggerStatus: 'interviewed',
  },
  {
    name: 'offer_letter',
    subject: 'Congratulations! Job Offer for {{job_title}} at {{company_name}}',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
  <div style="border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 24px;">
    <h2 style="margin: 0; color: #16a34a; font-size: 24px; font-weight: 600;">{{company_name}}</h2>
  </div>

  <p style="margin-bottom: 16px;">Dear {{applicant_first}},</p>

  <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center; border: 1px solid #bbf7d0;">
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #166534; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Congratulations</p>
    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #15803d;">We are delighted to offer you the position of</p>
    <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 700; color: #166534;">{{job_title}}</p>
  </div>

  <p style="margin-bottom: 16px;">Following our interview process, we are confident that your skills, experience, and professional approach make you an excellent addition to the {{company_name}} team. Your qualifications impressed us, and we believe you will thrive in this role.</p>

  <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <p style="margin: 0 0 16px 0; font-weight: 700; color: #111827; font-size: 16px;">Offer Details:</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">Position</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111827;">{{job_title}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Employment Type</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111827;">Remote / Contract</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Start Date</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #111827;">[To be confirmed]</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #6b7280;">Compensation</td>
        <td style="padding: 10px 0; font-weight: 600; color: #111827;">[To be discussed]</td>
      </tr>
    </table>
  </div>

  <p style="margin-bottom: 16px;">To discuss the full details of this offer, finalize your start date, and address any questions you may have, please schedule a call with our team at your earliest convenience:</p>

  <div style="text-align: center; margin: 28px 0;">
    <a href="https://outlook.office.com/book/TaskClearers1@TaskClearers.com/" style="display: inline-block; background-color: #16a34a; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(22, 163, 74, 0.25);">
      Schedule Your Offer Call
    </a>
  </div>

  <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
    <p style="margin: 0; font-weight: 500; color: #854d0e;">Next Steps</p>
    <p style="margin: 8px 0 0 0; font-size: 14px; color: #713f12;">Please respond within 5 business days to confirm your interest and schedule your offer discussion call. We are excited to move forward with you!</p>
  </div>

  <p style="margin-bottom: 16px;">We are thrilled at the prospect of having you join our team and look forward to the contributions you will make at {{company_name}}.</p>

  <p style="margin-bottom: 8px;">Warm regards,</p>
  <p style="margin: 0; font-weight: 600;">The {{company_name}} Team</p>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">This offer is contingent upon successful completion of any required background checks and verification of qualifications.</p>
  </div>
</div>`,
    triggerStatus: 'offered',
  },
  {
    name: 'status_update',
    subject: 'Update on Your Application - {{job_title}} at {{company_name}}',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
  <div style="border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 24px;">
    <h2 style="margin: 0; color: #16a34a; font-size: 24px; font-weight: 600;">{{company_name}}</h2>
  </div>

  <p style="margin-bottom: 16px;">Dear {{applicant_first}},</p>

  <p style="margin-bottom: 16px;">We wanted to reach out with an update regarding your application for the <strong>{{job_title}}</strong> position at {{company_name}}.</p>

  <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin: 24px 0; border: 1px solid #e5e7eb;">
    <p style="margin: 0 0 12px 0; font-weight: 600; color: #374151; font-size: 15px;">Status Update:</p>
    <p style="margin: 0; background-color: white; padding: 16px; border-radius: 8px; border: 1px dashed #d1d5db; color: #6b7280; font-style: italic;">
      [INSERT UPDATE HERE]
    </p>
  </div>

  <p style="margin-bottom: 16px;">Thank you for your continued interest in joining our team. We appreciate your patience throughout the hiring process.</p>

  <p style="margin-bottom: 16px;">If you have any questions or require additional information, please do not hesitate to reply to this email. We are here to help.</p>

  <p style="margin-bottom: 8px;">Best regards,</p>
  <p style="margin: 0; font-weight: 600;">The {{company_name}} Talent Team</p>

  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
    <p style="margin: 0;">Application submitted: {{application_date}} | Position: {{job_title}}</p>
  </div>
</div>`,
    triggerStatus: null,
  },
];

async function seed() {
  console.log('Seeding email templates...');

  const now = new Date();

  for (const template of defaultTemplates) {
    // Check if template already exists
    const [existing] = await db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.name, template.name))
      .limit(1);

    if (existing) {
      // Update existing template
      await db
        .update(emailTemplates)
        .set({
          subject: template.subject,
          body: template.body,
          triggerStatus: template.triggerStatus,
          updatedAt: now,
        })
        .where(eq(emailTemplates.name, template.name));

      console.log(`Updated template: ${template.name}`);
    } else {
      // Create new template
      await db.insert(emailTemplates).values({
        id: nanoid(),
        name: template.name,
        subject: template.subject,
        body: template.body,
        triggerStatus: template.triggerStatus,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`Created template: ${template.name}`);
    }
  }

  console.log('Email templates seeded successfully!');
}

seed().catch(console.error);
