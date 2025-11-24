import { jobOpenings } from '../positions';
import JobPageClient from './JobPageClient';

export default function GeneralApplicationPage() {
  const job = jobOpenings.find(job => job.id === 'general-application');

  if (!job) {
    return <div>Job not found</div>;
  }

  return <JobPageClient job={job} />;
}