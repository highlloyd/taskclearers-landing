import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db, receivedEmails, applications } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { eq, desc, inArray } from 'drizzle-orm';
import { fetchInboxEmails, isMailReadConfigured } from '@/lib/email/microsoft-graph';

// POST /api/admin/emails/sync - Sync emails from shared mailbox
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isMailReadConfigured()) {
    return NextResponse.json(
      { error: 'Email sync not configured. Please set up Azure AD with Mail.Read permission.' },
      { status: 400 }
    );
  }

  try {
    // Get the most recent synced email to determine the cutoff date
    const [lastSynced] = await db
      .select({ receivedAt: receivedEmails.receivedAt })
      .from(receivedEmails)
      .orderBy(desc(receivedEmails.receivedAt))
      .limit(1);

    // Fetch emails from the last 7 days or since last sync
    const since = lastSynced?.receivedAt
      ? new Date(lastSynced.receivedAt.getTime() - 60000) // 1 minute buffer for overlap
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: last 7 days

    const emails = await fetchInboxEmails({
      top: 100,
      since,
    });

    if (emails.length === 0) {
      return NextResponse.json({ synced: 0, matched: 0 });
    }

    // Get existing message IDs to avoid duplicates
    const existingIds = await db
      .select({ graphMessageId: receivedEmails.graphMessageId })
      .from(receivedEmails)
      .where(
        inArray(
          receivedEmails.graphMessageId,
          emails.map((e) => e.id)
        )
      );

    const existingIdSet = new Set(existingIds.map((e) => e.graphMessageId));

    // Filter out already synced emails
    const newEmails = emails.filter((e) => !existingIdSet.has(e.id));

    if (newEmails.length === 0) {
      return NextResponse.json({ synced: 0, matched: 0 });
    }

    // Get all applicant emails for matching
    const allApplications = await db
      .select({
        id: applications.id,
        email: applications.email,
      })
      .from(applications);

    const emailToAppId = new Map(
      allApplications.map((app) => [app.email.toLowerCase(), app.id])
    );

    // Insert new emails
    let synced = 0;
    let matched = 0;

    for (const email of newEmails) {
      const fromEmail = email.from.emailAddress.address.toLowerCase();
      const applicationId = emailToAppId.get(fromEmail) || null;

      if (applicationId) {
        matched++;
      }

      await db.insert(receivedEmails).values({
        id: nanoid(),
        applicationId,
        graphMessageId: email.id,
        conversationId: email.conversationId,
        fromEmail: email.from.emailAddress.address,
        fromName: email.from.emailAddress.name,
        subject: email.subject,
        bodyPreview: email.bodyPreview,
        body: email.body.content,
        receivedAt: new Date(email.receivedDateTime),
        isRead: false,
      });

      synced++;
    }

    return NextResponse.json({ synced, matched });
  } catch (error) {
    console.error('Failed to sync emails:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync emails' },
      { status: 500 }
    );
  }
}

// GET /api/admin/emails/sync - Get sync status
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [lastSynced] = await db
      .select({ receivedAt: receivedEmails.receivedAt })
      .from(receivedEmails)
      .orderBy(desc(receivedEmails.receivedAt))
      .limit(1);

    const [totalCount] = await db
      .select({ count: receivedEmails.id })
      .from(receivedEmails);

    return NextResponse.json({
      configured: isMailReadConfigured(),
      lastSyncedAt: lastSynced?.receivedAt || null,
      totalEmails: totalCount ? 1 : 0, // Simplified count
    });
  } catch (error) {
    console.error('Failed to get sync status:', error);
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 });
  }
}
