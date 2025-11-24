import { jobOpenings } from '../positions';
import JobPageClient from './JobPageClient';

export async function generateStaticParams() {
  return jobOpenings
    .filter((job) => job.id !== 'general-application')
    .map((job) => ({
      id: job.id,
    }));
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const job = jobOpenings.find(j => j.id === params.id);
  if (!job) {
    return {
      title: 'Job Not Found'
    };
  }
  return {
    title: `${job.title} | TaskClearers`
  };
}

export default function JobPage({ params }: { params: { id: string } }) {
  const job = jobOpenings.find(j => j.id === params.id);

  if (!job) {
    return <div>Job not found</div>;
  }

  return <JobPageClient job={job} />;
}