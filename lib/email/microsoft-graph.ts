import { ConfidentialClientApplication } from '@azure/msal-node';

// Email identity types
export type EmailIdentity = 'admin' | 'sales' | 'hiring' | 'personal';

export interface EmailIdentityConfig {
  id: EmailIdentity;
  email: string;
  name: string;
  label: string; // Display label for UI
}

// Get email identities from environment
export function getEmailIdentities(): EmailIdentityConfig[] {
  const identities: EmailIdentityConfig[] = [];

  if (process.env.EMAIL_ADMIN) {
    identities.push({
      id: 'admin',
      email: process.env.EMAIL_ADMIN,
      name: process.env.EMAIL_ADMIN_NAME || 'TaskClearers Admin',
      label: 'Admin',
    });
  }

  if (process.env.EMAIL_SALES) {
    identities.push({
      id: 'sales',
      email: process.env.EMAIL_SALES,
      name: process.env.EMAIL_SALES_NAME || 'TaskClearers Sales',
      label: 'Sales',
    });
  }

  if (process.env.EMAIL_HIRING) {
    identities.push({
      id: 'hiring',
      email: process.env.EMAIL_HIRING,
      name: process.env.EMAIL_HIRING_NAME || 'TaskClearers Hiring',
      label: 'Hiring/HR',
    });
  }

  // Fallback to legacy O365_SHARED_MAILBOX if no identities configured
  if (identities.length === 0 && process.env.O365_SHARED_MAILBOX) {
    identities.push({
      id: 'hiring',
      email: process.env.O365_SHARED_MAILBOX,
      name: 'TaskClearers',
      label: 'Default',
    });
  }

  return identities;
}

// Get default identity for a context
export function getDefaultIdentity(context: 'admin' | 'sales' | 'hiring' | 'notification'): EmailIdentityConfig | null {
  const identities = getEmailIdentities();

  if (context === 'admin' || context === 'notification') {
    return identities.find(i => i.id === 'admin') || identities[0] || null;
  }
  if (context === 'sales') {
    return identities.find(i => i.id === 'sales') || identities[0] || null;
  }
  if (context === 'hiring') {
    return identities.find(i => i.id === 'hiring') || identities[0] || null;
  }

  return identities[0] || null;
}

// Get identity by email address
export function getIdentityByEmail(email: string): EmailIdentityConfig | null {
  return getEmailIdentities().find(i => i.email.toLowerCase() === email.toLowerCase()) || null;
}

interface GraphEmailOptions {
  to: string;
  subject: string;
  body: string; // HTML content
  from?: string; // Email address to send from (must be a configured identity)
  fromName?: string; // Display name for the from address
  saveToSentItems?: boolean;
}

interface GraphTokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: GraphTokenCache | null = null;

function getMsalClient(): ConfidentialClientApplication {
  if (!process.env.AZURE_CLIENT_ID || !process.env.AZURE_TENANT_ID || !process.env.AZURE_CLIENT_SECRET) {
    throw new Error('Microsoft Graph credentials not configured');
  }

  return new ConfidentialClientApplication({
    auth: {
      clientId: process.env.AZURE_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  });
}

async function getAccessToken(): Promise<string> {
  // Check cache first (with 5 min buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenCache.accessToken;
  }

  const msalClient = getMsalClient();
  const result = await msalClient.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });

  if (!result || !result.accessToken) {
    throw new Error('Failed to acquire access token');
  }

  tokenCache = {
    accessToken: result.accessToken,
    expiresAt: result.expiresOn?.getTime() || Date.now() + 3600000,
  };

  return result.accessToken;
}

export async function sendEmailViaGraph(options: GraphEmailOptions): Promise<{ messageId: string }> {
  // Determine which mailbox to send from
  let fromEmail = options.from;
  let fromName = options.fromName;

  if (!fromEmail) {
    // Fall back to first configured identity or legacy env var
    const defaultIdentity = getDefaultIdentity('hiring');
    if (defaultIdentity) {
      fromEmail = defaultIdentity.email;
      fromName = fromName || defaultIdentity.name;
    } else if (process.env.O365_SHARED_MAILBOX) {
      fromEmail = process.env.O365_SHARED_MAILBOX;
    } else {
      throw new Error('No email identity configured');
    }
  }

  // If fromName not provided, try to get it from identity config
  if (!fromName) {
    const identity = getIdentityByEmail(fromEmail);
    fromName = identity?.name || 'TaskClearers';
  }

  const accessToken = await getAccessToken();

  const emailPayload = {
    message: {
      subject: options.subject,
      body: {
        contentType: 'HTML',
        content: options.body,
      },
      toRecipients: [
        {
          emailAddress: {
            address: options.to,
          },
        },
      ],
      from: {
        emailAddress: {
          address: fromEmail,
          name: fromName,
        },
      },
    },
    saveToSentItems: options.saveToSentItems ?? true,
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${response.status} - ${error}`);
  }

  // sendMail doesn't return messageId; we generate our own tracking ID
  return { messageId: `graph-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
}

// Check if Microsoft Graph is configured
export function isGraphConfigured(): boolean {
  const hasCredentials = !!(
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_SECRET
  );

  const hasMailbox = !!(
    process.env.EMAIL_ADMIN ||
    process.env.EMAIL_SALES ||
    process.env.EMAIL_HIRING ||
    process.env.O365_SHARED_MAILBOX
  );

  return hasCredentials && hasMailbox;
}

// Development fallback - logs email to console
export function logEmailToConsole(options: GraphEmailOptions): void {
  console.log('=== Email (Graph API not configured) ===');
  console.log(`From: ${options.from || '(default)'}`);
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log('Body:');
  console.log(options.body);
  console.log('==========================================');
}

// Main send function with fallback (renamed from sendApplicantEmail for clarity)
export async function sendEmail(options: GraphEmailOptions): Promise<{ messageId: string; sent: boolean; from?: string }> {
  if (!isGraphConfigured()) {
    logEmailToConsole(options);
    return { messageId: `dev-${Date.now()}`, sent: false };
  }

  const result = await sendEmailViaGraph(options);
  return { ...result, sent: true, from: options.from };
}

// Backward compatibility alias
export const sendApplicantEmail = sendEmail;

// Fetch emails from shared mailbox
export interface GraphEmail {
  id: string;
  conversationId: string | null;
  subject: string;
  bodyPreview: string;
  body: {
    contentType: string;
    content: string;
  };
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  receivedDateTime: string;
  isRead: boolean;
}

export async function fetchInboxEmails(options: {
  top?: number;
  filter?: string;
  since?: Date;
}): Promise<GraphEmail[]> {
  const sharedMailbox = process.env.O365_SHARED_MAILBOX;
  if (!sharedMailbox) {
    throw new Error('O365_SHARED_MAILBOX not configured');
  }

  const accessToken = await getAccessToken();

  // Build query parameters
  const params = new URLSearchParams();
  params.set('$top', String(options.top || 50));
  params.set('$orderby', 'receivedDateTime desc');
  params.set('$select', 'id,conversationId,subject,bodyPreview,body,from,receivedDateTime,isRead');

  // Filter to only get emails since a certain date
  const filters: string[] = [];
  if (options.since) {
    filters.push(`receivedDateTime ge ${options.since.toISOString()}`);
  }
  if (options.filter) {
    filters.push(options.filter);
  }
  if (filters.length > 0) {
    params.set('$filter', filters.join(' and '));
  }

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${sharedMailbox}/mailFolders/inbox/messages?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch emails: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.value || [];
}

// Check if Mail.Read permission is configured (for sync feature)
export function isMailReadConfigured(): boolean {
  return isGraphConfigured();
}
