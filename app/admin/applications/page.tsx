import { db, applications, jobs, receivedEmails } from '@/lib/db';
import { eq, desc, sql } from 'drizzle-orm';
import ApplicationsClient from '@/components/admin/ApplicationsClient';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  // Get all applications
  const allApplications = await db
    .select({
      id: applications.id,
      firstName: applications.firstName,
      lastName: applications.lastName,
      email: applications.email,
      phone: applications.phone,
      status: applications.status,
      createdAt: applications.createdAt,
      jobId: applications.jobId,
      jobTitle: jobs.title,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.createdAt));

  // Get applications with replies
  const applicationsWithReplies = await db
    .select({ applicationId: receivedEmails.applicationId })
    .from(receivedEmails)
    .groupBy(receivedEmails.applicationId);

  const replySet = new Set(applicationsWithReplies.map(r => r.applicationId));

  // Add hasReply flag
  const applicationsWithReplyFlag = allApplications.map(app => ({
    ...app,
    hasReply: replySet.has(app.id),
  }));

  const allJobs = await db.select({ id: jobs.id, title: jobs.title }).from(jobs);

  return (
    <ApplicationsClient
      applications={applicationsWithReplyFlag}
      jobs={allJobs}
    />
  );
}
