import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { db, jobs } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import JobPageClient from './JobPageClient';
import { trackEvent, hashIP, getClientIP } from '@/lib/analytics/tracking';
import { EVENT_TYPES } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

async function getJob(id: string) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.isActive, true)))
    .limit(1);

  if (job) {
    // Track job view event
    const headersList = await headers();
    const clientIp = getClientIP(headersList);
    await trackEvent(
      EVENT_TYPES.JOB_VIEW,
      { page_path: `/careers/${id}` },
      { jobId: id, ipHash: hashIP(clientIp) }
    );

    // Keep viewCount updated for backwards compatibility
    await db
      .update(jobs)
      .set({ viewCount: job.viewCount + 1 })
      .where(eq(jobs.id, id));
  }

  return job;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return {
      title: 'Job Not Found'
    };
  }

  return {
    title: `${job.title} | TaskClearers`
  };
}

export default async function JobPage({ params }: Props) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  return <JobPageClient job={job} />;
}