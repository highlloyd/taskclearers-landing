import type { EmailTemplate, Application, Job } from '@/lib/db/schema';

// Placeholder definitions for email templates
export const PLACEHOLDERS = {
  '{{applicant_name}}': 'Full name (first + last)',
  '{{applicant_first}}': 'First name only',
  '{{job_title}}': 'Position title',
  '{{company_name}}': 'TaskClearers',
  '{{application_date}}': 'Date they applied',
} as const;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

interface TemplateData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  applicationDate: Date | null;
}

const COMPANY_NAME = 'TaskClearers';

export function renderTemplate(template: string, data: TemplateData): string {
  const replacements: Record<string, string> = {
    '{{applicant_name}}': `${data.firstName} ${data.lastName}`,
    '{{applicant_first}}': data.firstName,
    '{{job_title}}': data.jobTitle,
    '{{company_name}}': COMPANY_NAME,
    '{{application_date}}': data.applicationDate
      ? data.applicationDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'N/A',
  };

  let result = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return result;
}

export function renderEmailTemplate(
  template: Pick<EmailTemplate, 'subject' | 'body'>,
  data: TemplateData
): { subject: string; body: string } {
  return {
    subject: renderTemplate(template.subject, data),
    body: renderTemplate(template.body, data),
  };
}

// Get template data from application and job
export function getTemplateData(
  application: Pick<Application, 'firstName' | 'lastName' | 'createdAt'>,
  jobTitle: string
): TemplateData {
  return {
    firstName: application.firstName,
    lastName: application.lastName,
    jobTitle: jobTitle,
    applicationDate: application.createdAt,
  };
}

// Status to template mapping for auto-suggestions
export const STATUS_TEMPLATE_MAP: Record<string, string> = {
  rejected: 'rejection',
  interviewed: 'interview_invite',
  offered: 'offer_letter',
};

// Check if a status change should prompt for email
export function shouldPromptForEmail(newStatus: string): boolean {
  return newStatus in STATUS_TEMPLATE_MAP;
}

// Get suggested template name for a status
export function getSuggestedTemplateName(status: string): string | null {
  return STATUS_TEMPLATE_MAP[status] || null;
}
