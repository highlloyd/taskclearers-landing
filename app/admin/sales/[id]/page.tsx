import { db, salesLeads, adminUsers, salesLeadNotes, salesLeadActivityLog } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Building, User, DollarSign, Calendar, TrendingUp, Tag } from 'lucide-react';
import SalesLeadStatusBadge from '@/components/admin/SalesLeadStatusBadge';
import SalesLeadDetailClient from '@/components/admin/SalesLeadDetailClient';
import { getSession } from '@/lib/auth';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SalesLeadDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();

  const [lead] = await db
    .select({
      id: salesLeads.id,
      companyName: salesLeads.companyName,
      contactName: salesLeads.contactName,
      contactEmail: salesLeads.contactEmail,
      contactPhone: salesLeads.contactPhone,
      stage: salesLeads.stage,
      estimatedValue: salesLeads.estimatedValue,
      currency: salesLeads.currency,
      source: salesLeads.source,
      assignedTo: salesLeads.assignedTo,
      wonDate: salesLeads.wonDate,
      lostDate: salesLeads.lostDate,
      lostReason: salesLeads.lostReason,
      createdAt: salesLeads.createdAt,
      updatedAt: salesLeads.updatedAt,
      createdBy: salesLeads.createdBy,
      assignedToName: adminUsers.name,
      assignedToEmail: adminUsers.email,
    })
    .from(salesLeads)
    .leftJoin(adminUsers, eq(salesLeads.assignedTo, adminUsers.id))
    .where(eq(salesLeads.id, id))
    .limit(1);

  if (!lead) {
    notFound();
  }

  // Fetch notes
  const notes = await db
    .select({
      id: salesLeadNotes.id,
      content: salesLeadNotes.content,
      category: salesLeadNotes.category,
      createdAt: salesLeadNotes.createdAt,
      updatedAt: salesLeadNotes.updatedAt,
      adminUserId: salesLeadNotes.adminUserId,
      adminName: adminUsers.name,
      adminEmail: adminUsers.email,
    })
    .from(salesLeadNotes)
    .leftJoin(adminUsers, eq(salesLeadNotes.adminUserId, adminUsers.id))
    .where(eq(salesLeadNotes.leadId, id))
    .orderBy(desc(salesLeadNotes.createdAt));

  // Fetch recent activity
  const activity = await db
    .select({
      id: salesLeadActivityLog.id,
      action: salesLeadActivityLog.action,
      field: salesLeadActivityLog.field,
      previousValue: salesLeadActivityLog.previousValue,
      newValue: salesLeadActivityLog.newValue,
      metadata: salesLeadActivityLog.metadata,
      createdAt: salesLeadActivityLog.createdAt,
      adminName: adminUsers.name,
      adminEmail: adminUsers.email,
    })
    .from(salesLeadActivityLog)
    .leftJoin(adminUsers, eq(salesLeadActivityLog.adminUserId, adminUsers.id))
    .where(eq(salesLeadActivityLog.leadId, id))
    .orderBy(desc(salesLeadActivityLog.createdAt))
    .limit(20);

  const parsedActivity = activity.map((a) => ({
    ...a,
    previousValue: a.previousValue ? JSON.parse(a.previousValue) : null,
    newValue: a.newValue ? JSON.parse(a.newValue) : null,
    metadata: a.metadata ? JSON.parse(a.metadata) : null,
  }));

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  return (
    <div>
      <Link
        href="/admin/sales"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sales Pipeline
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Building className="w-5 h-5 text-gray-400" />
                  <h1 className="text-2xl font-bold text-gray-900">
                    {lead.companyName}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-4 h-4" />
                  <span>{lead.contactName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SalesLeadStatusBadge stage={lead.stage} />
                <Link
                  href={`/admin/sales/${id}/edit`}
                  className="px-4 py-2 text-sm font-medium text-green-600 border border-green-600 rounded-lg hover:bg-green-50"
                >
                  Edit
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${lead.contactEmail}`} className="hover:text-green-600">
                  {lead.contactEmail}
                </a>
              </div>
              {lead.contactPhone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <a href={`tel:${lead.contactPhone}`} className="hover:text-green-600">
                    {lead.contactPhone}
                  </a>
                </div>
              )}
            </div>

            {/* Value & Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
              {lead.estimatedValue && (
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-600">
                    {formatCurrency(lead.estimatedValue, lead.currency || 'USD')}
                  </span>
                  <span className="text-gray-400 text-sm">estimated value</span>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Tag className="w-4 h-4" />
                  <span>Source: {lead.source}</span>
                </div>
              )}
            </div>

            {/* Won/Lost Info */}
            {(lead.wonDate || lead.lostDate) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                {lead.wonDate && (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      Won on {lead.wonDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {lead.lostDate && (
                  <div className="text-red-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Lost on {lead.lostDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {lead.lostReason && (
                      <p className="text-sm mt-1 ml-6">Reason: {lead.lostReason}</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Client component for interactive sections */}
          <SalesLeadDetailClient
            leadId={id}
            initialNotes={notes}
            currentUserId={session?.user.id}
            lead={{
              companyName: lead.companyName,
              contactName: lead.contactName,
              contactEmail: lead.contactEmail,
              stage: lead.stage,
              estimatedValue: lead.estimatedValue,
              currency: lead.currency,
            }}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lead Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Details</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm text-gray-500">Lead ID</dt>
                <dd className="text-gray-900 font-mono text-sm">{lead.id}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Stage</dt>
                <dd><SalesLeadStatusBadge stage={lead.stage} /></dd>
              </div>
              {lead.estimatedValue && (
                <div>
                  <dt className="text-sm text-gray-500">Estimated Value</dt>
                  <dd className="text-gray-900 font-medium text-green-600">
                    {formatCurrency(lead.estimatedValue, lead.currency || 'USD')}
                  </dd>
                </div>
              )}
              {lead.source && (
                <div>
                  <dt className="text-sm text-gray-500">Source</dt>
                  <dd className="text-gray-900">{lead.source}</dd>
                </div>
              )}
              {lead.assignedToName && (
                <div>
                  <dt className="text-sm text-gray-500">Assigned To</dt>
                  <dd className="text-gray-900">{lead.assignedToName}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd className="text-gray-900">
                  {lead.createdAt?.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </dd>
              </div>
              {lead.updatedAt && (
                <div>
                  <dt className="text-sm text-gray-500">Last Updated</dt>
                  <dd className="text-gray-900">
                    {lead.updatedAt?.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              )}
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
                        {item.action === 'created' && 'Lead created'}
                        {item.action === 'updated' && `${item.field} updated`}
                        {item.action === 'stage_changed' && `Stage changed to ${item.newValue}`}
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
