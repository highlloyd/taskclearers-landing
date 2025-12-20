import { db, salesLeads, adminUsers } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import SalesLeadsClient from '@/components/admin/SalesLeadsClient';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  // Get all sales leads with assignee info
  const allLeads = await db
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
      createdAt: salesLeads.createdAt,
      assignedToName: adminUsers.name,
    })
    .from(salesLeads)
    .leftJoin(adminUsers, eq(salesLeads.assignedTo, adminUsers.id))
    .orderBy(desc(salesLeads.createdAt));

  // Get unique sources for filter dropdown
  const sourcesResult = await db
    .selectDistinct({ source: salesLeads.source })
    .from(salesLeads)
    .orderBy(salesLeads.source);

  const sources = sourcesResult
    .map((s) => s.source)
    .filter((s): s is string => s !== null);

  // Get all admin users for assignee filter
  const allAdminUsers = await db
    .select({ id: adminUsers.id, name: adminUsers.name })
    .from(adminUsers)
    .orderBy(adminUsers.name);

  return (
    <SalesLeadsClient
      leads={allLeads}
      sources={sources}
      assignees={allAdminUsers}
    />
  );
}
