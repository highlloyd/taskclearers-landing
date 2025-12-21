import { db, applications, jobs } from '@/lib/db';
import { count, eq, desc, gte } from 'drizzle-orm';
import { Users, Briefcase, UserCheck, Clock } from 'lucide-react';
import StatsCard from '@/components/admin/StatsCard';
import StatusBadge from '@/components/admin/StatusBadge';
import Link from 'next/link';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

async function getStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalApplications,
    newApplications,
    activeJobs,
    recentApplications,
  ] = await Promise.all([
    db.select({ count: count() }).from(applications),
    db.select({ count: count() }).from(applications).where(eq(applications.status, 'new')),
    db.select({ count: count() }).from(jobs).where(eq(jobs.isActive, true)),
    db
      .select({
        id: applications.id,
        firstName: applications.firstName,
        lastName: applications.lastName,
        email: applications.email,
        status: applications.status,
        createdAt: applications.createdAt,
        jobTitle: jobs.title,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applications.createdAt))
      .limit(5),
  ]);

  // Get applications by status
  const statusCounts = await db
    .select({
      status: applications.status,
      count: count(),
    })
    .from(applications)
    .groupBy(applications.status);

  return {
    totalApplications: totalApplications[0]?.count || 0,
    newApplications: newApplications[0]?.count || 0,
    activeJobs: activeJobs[0]?.count || 0,
    recentApplications,
    statusCounts: Object.fromEntries(statusCounts.map(s => [s.status, s.count])),
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Applications"
          value={stats.totalApplications}
          icon={Users}
        />
        <StatsCard
          title="New Applications"
          value={stats.newApplications}
          changeType="positive"
          icon={Clock}
        />
        <StatsCard
          title="Active Jobs"
          value={stats.activeJobs}
          icon={Briefcase}
        />
        <StatsCard
          title="Hired"
          value={stats.statusCounts.hired || 0}
          icon={UserCheck}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
            <Link href="/admin/applications" className="text-sm text-green-600 hover:text-green-700">
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentApplications.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No applications yet
              </div>
            ) : (
              stats.recentApplications.map((app) => (
                <Link
                  key={app.id}
                  href={`/admin/applications/${app.id}`}
                  className="block px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.firstName} {app.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{app.jobTitle}</p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Applications by Status</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {['new', 'reviewing', 'interviewed', 'offered', 'hired', 'rejected'].map((status) => {
                const count = stats.statusCounts[status] || 0;
                const percentage = stats.totalApplications > 0
                  ? Math.round((count / stats.totalApplications) * 100)
                  : 0;

                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <StatusBadge status={status} />
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
