import { db, applications, jobs, applicationNotes, adminUsers } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import ResumeViewer from '@/components/admin/ResumeViewer';
import StatusBadge, { statusLabels } from '@/components/admin/StatusBadge';
import ApplicationActions from './ApplicationActions';
import EmailHistory from '@/components/admin/EmailHistory';
import { getSession } from '@/lib/auth';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  const [application] = await db
    .select({
      id: applications.id,
      firstName: applications.firstName,
      lastName: applications.lastName,
      email: applications.email,
      phone: applications.phone,
      resumePath: applications.resumePath,
      coverLetter: applications.coverLetter,
      goodAt: applications.goodAt,
      status: applications.status,
      createdAt: applications.createdAt,
      jobId: applications.jobId,
      jobTitle: jobs.title,
      jobDepartment: jobs.department,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.id, id))
    .limit(1);

  if (!application) {
    notFound();
  }

  const notes = await db
    .select({
      id: applicationNotes.id,
      content: applicationNotes.content,
      createdAt: applicationNotes.createdAt,
      adminUserId: applicationNotes.adminUserId,
      adminName: adminUsers.name,
      adminEmail: adminUsers.email,
    })
    .from(applicationNotes)
    .leftJoin(adminUsers, eq(applicationNotes.adminUserId, adminUsers.id))
    .where(eq(applicationNotes.applicationId, id))
    .orderBy(desc(applicationNotes.createdAt));

  return (
    <div>
      <Link
        href="/admin/applications"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {application.firstName} {application.lastName}
                </h1>
                <p className="text-gray-500 mt-1">
                  Applied for {application.jobTitle}
                </p>
              </div>
              <StatusBadge status={application.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${application.email}`} className="hover:text-green-600">
                  {application.email}
                </a>
              </div>
              {application.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${application.phone}`} className="hover:text-green-600">
                    {application.phone}
                  </a>
                </div>
              )}
            </div>

            {application.resumePath && (
              <div className="mb-6">
                <ResumeViewer resumePath={application.resumePath} />
              </div>
            )}

            {application.coverLetter && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Cover Letter</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                  {application.coverLetter}
                </div>
              </div>
            )}

            {application.goodAt && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">What they would be good at</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap">
                  {application.goodAt}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
            <ApplicationActions
              applicationId={id}
              notes={notes}
              currentStatus={application.status}
              currentUserId={session?.user.id}
              application={{
                firstName: application.firstName,
                lastName: application.lastName,
                email: application.email,
                jobTitle: application.jobTitle,
              }}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Applied on</dt>
                <dd className="text-gray-900">
                  {application.createdAt?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Position</dt>
                <dd className="text-gray-900">{application.jobTitle}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Department</dt>
                <dd className="text-gray-900">{application.jobDepartment}</dd>
              </div>
            </dl>
          </div>

          <EmailHistory applicationId={id} />
        </div>
      </div>
    </div>
  );
}
