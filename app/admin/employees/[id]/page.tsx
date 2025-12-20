import { db, employees, jobs, adminUsers, employeeNotes, employeeDocuments, employeeActivityLog } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, DollarSign, Building, Briefcase } from 'lucide-react';
import EmployeeStatusBadge from '@/components/admin/EmployeeStatusBadge';
import EmployeeDetailClient from './EmployeeDetailClient';
import { getSession } from '@/lib/auth';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  const [employee] = await db
    .select({
      id: employees.id,
      applicationId: employees.applicationId,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      phone: employees.phone,
      department: employees.department,
      role: employees.role,
      jobId: employees.jobId,
      hireDate: employees.hireDate,
      salary: employees.salary,
      benefits: employees.benefits,
      address: employees.address,
      emergencyContact: employees.emergencyContact,
      status: employees.status,
      terminationDate: employees.terminationDate,
      terminationReason: employees.terminationReason,
      createdAt: employees.createdAt,
      updatedAt: employees.updatedAt,
      createdBy: employees.createdBy,
      jobTitle: jobs.title,
      jobDepartment: jobs.department,
      createdByName: adminUsers.name,
      createdByEmail: adminUsers.email,
    })
    .from(employees)
    .leftJoin(jobs, eq(employees.jobId, jobs.id))
    .leftJoin(adminUsers, eq(employees.createdBy, adminUsers.id))
    .where(eq(employees.id, id))
    .limit(1);

  if (!employee) {
    notFound();
  }

  // Parse JSON fields
  const salary = employee.salary ? JSON.parse(employee.salary) : null;
  const address = employee.address ? JSON.parse(employee.address) : null;
  const emergencyContact = employee.emergencyContact ? JSON.parse(employee.emergencyContact) : null;

  // Fetch notes
  const notes = await db
    .select({
      id: employeeNotes.id,
      content: employeeNotes.content,
      category: employeeNotes.category,
      createdAt: employeeNotes.createdAt,
      updatedAt: employeeNotes.updatedAt,
      adminUserId: employeeNotes.adminUserId,
      adminName: adminUsers.name,
      adminEmail: adminUsers.email,
    })
    .from(employeeNotes)
    .leftJoin(adminUsers, eq(employeeNotes.adminUserId, adminUsers.id))
    .where(eq(employeeNotes.employeeId, id))
    .orderBy(desc(employeeNotes.createdAt));

  // Fetch documents
  const documents = await db
    .select({
      id: employeeDocuments.id,
      name: employeeDocuments.name,
      type: employeeDocuments.type,
      filePath: employeeDocuments.filePath,
      fileSize: employeeDocuments.fileSize,
      mimeType: employeeDocuments.mimeType,
      description: employeeDocuments.description,
      expiresAt: employeeDocuments.expiresAt,
      createdAt: employeeDocuments.createdAt,
      uploadedByName: adminUsers.name,
    })
    .from(employeeDocuments)
    .leftJoin(adminUsers, eq(employeeDocuments.uploadedBy, adminUsers.id))
    .where(eq(employeeDocuments.employeeId, id))
    .orderBy(desc(employeeDocuments.createdAt));

  // Fetch recent activity
  const activity = await db
    .select({
      id: employeeActivityLog.id,
      action: employeeActivityLog.action,
      field: employeeActivityLog.field,
      previousValue: employeeActivityLog.previousValue,
      newValue: employeeActivityLog.newValue,
      metadata: employeeActivityLog.metadata,
      createdAt: employeeActivityLog.createdAt,
      adminName: adminUsers.name,
      adminEmail: adminUsers.email,
    })
    .from(employeeActivityLog)
    .leftJoin(adminUsers, eq(employeeActivityLog.adminUserId, adminUsers.id))
    .where(eq(employeeActivityLog.employeeId, id))
    .orderBy(desc(employeeActivityLog.createdAt))
    .limit(20);

  const parsedActivity = activity.map((a) => ({
    ...a,
    previousValue: a.previousValue ? JSON.parse(a.previousValue) : null,
    newValue: a.newValue ? JSON.parse(a.newValue) : null,
    metadata: a.metadata ? JSON.parse(a.metadata) : null,
  }));

  const formatSalary = () => {
    if (!salary) return null;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency || 'USD',
      maximumFractionDigits: 0,
    }).format(salary.amount);
    return `${formatted}/${salary.frequency === 'annual' ? 'year' : salary.frequency === 'monthly' ? 'month' : 'hour'}`;
  };

  return (
    <div>
      <Link
        href="/admin/employees"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Employees
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-gray-500 mt-1">{employee.role}</p>
              </div>
              <div className="flex items-center gap-3">
                <EmployeeStatusBadge status={employee.status} />
                <Link
                  href={`/admin/employees/${id}/edit`}
                  className="px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
                >
                  Edit
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${employee.email}`} className="hover:text-green-600">
                  {employee.email}
                </a>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${employee.phone}`} className="hover:text-green-600">
                    {employee.phone}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Building className="w-4 h-4" />
                <span>{employee.department}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Briefcase className="w-4 h-4" />
                <span>{employee.role}</span>
              </div>
            </div>

            {/* Salary & Hire Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Hired {employee.hireDate?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              {salary && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatSalary()}</span>
                </div>
              )}
            </div>

            {/* Address */}
            {address && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div>
                    <p>{address.street}</p>
                    <p>{address.city}, {address.state} {address.zip}</p>
                    <p>{address.country}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            {emergencyContact && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</h3>
                <div className="text-gray-600">
                  <p className="font-medium">{emergencyContact.name} ({emergencyContact.relationship})</p>
                  {emergencyContact.phone && <p>{emergencyContact.phone}</p>}
                  {emergencyContact.email && <p>{emergencyContact.email}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Client component for interactive sections */}
          <EmployeeDetailClient
            employeeId={id}
            initialNotes={notes}
            initialDocuments={documents}
            currentUserId={session?.user.id}
            employee={{
              firstName: employee.firstName,
              lastName: employee.lastName,
              email: employee.email,
              department: employee.department,
              role: employee.role,
              status: employee.status,
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Employee Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Employee ID</dt>
                <dd className="text-gray-900 font-mono text-sm">{employee.id}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd><EmployeeStatusBadge status={employee.status} /></dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Hire Date</dt>
                <dd className="text-gray-900">
                  {employee.hireDate?.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              {employee.terminationDate && (
                <div>
                  <dt className="text-sm text-gray-500">Termination Date</dt>
                  <dd className="text-gray-900">
                    {employee.terminationDate?.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              )}
              {employee.applicationId && (
                <div>
                  <dt className="text-sm text-gray-500">From Application</dt>
                  <dd>
                    <Link
                      href={`/admin/applications/${employee.applicationId}`}
                      className="text-green-600 hover:text-green-700 text-sm"
                    >
                      View Application
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Added By</dt>
                <dd className="text-gray-900">
                  {employee.createdByName || employee.createdByEmail || 'System'}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Added On</dt>
                <dd className="text-gray-900">
                  {employee.createdAt?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
            </dl>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            {parsedActivity.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet</p>
            ) : (
              <div className="space-y-4">
                {parsedActivity.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        {item.action === 'created' && 'Employee record created'}
                        {item.action === 'updated' && `${item.field} updated`}
                        {item.action === 'status_changed' && `Status changed to ${item.newValue}`}
                        {item.action === 'document_uploaded' && `Document uploaded: ${item.metadata?.name}`}
                        {item.action === 'document_deleted' && `Document deleted: ${item.metadata?.name}`}
                        {item.action === 'note_added' && 'Note added'}
                        {item.action === 'email_sent' && 'Email sent'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.adminName || 'System'} &middot; {item.createdAt?.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
