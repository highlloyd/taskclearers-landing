import { db, jobs, applications } from '@/lib/db';
import { eq, desc, count } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Edit, Eye, EyeOff } from 'lucide-react';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const allJobs = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      department: jobs.department,
      location: jobs.location,
      isActive: jobs.isActive,
      viewCount: jobs.viewCount,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .orderBy(desc(jobs.createdAt));

  // Get application counts per job
  const applicationCounts = await db
    .select({
      jobId: applications.jobId,
      count: count(),
    })
    .from(applications)
    .groupBy(applications.jobId);

  const countMap = Object.fromEntries(applicationCounts.map(c => [c.jobId, c.count]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applications
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No jobs yet. <Link href="/admin/jobs/new" className="text-green-600 hover:text-green-700">Create your first job</Link>
                  </td>
                </tr>
              ) : (
                allJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{job.title}</p>
                      <p className="text-sm text-gray-500">{job.location}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {job.department}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {countMap[job.id] || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {job.viewCount}
                    </td>
                    <td className="px-6 py-4">
                      {job.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Eye className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <EyeOff className="w-3 h-3" />
                          Hidden
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/jobs/${job.id}/edit`}
                        className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
