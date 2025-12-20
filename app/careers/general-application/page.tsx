import { db, jobs } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import JobPageClient from './JobPageClient';

export const dynamic = 'force-dynamic';

async function getGeneralApplication() {
  // Try to find existing general-application job
  let [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, 'general-application'))
    .limit(1);

  // Create it if it doesn't exist
  if (!job) {
    await db.insert(jobs).values({
      id: 'general-application',
      title: 'General Application',
      location: 'Remote',
      department: 'General',
      description: "If you don't see a position that fits your skills, you can submit a general application.",
      isActive: true,
    });

    [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, 'general-application'))
      .limit(1);
  }

  return job;
}

export default async function GeneralApplicationPage() {
  const job = await getGeneralApplication();

  return <JobPageClient job={job} />;
}