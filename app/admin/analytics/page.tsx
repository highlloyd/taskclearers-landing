import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (!hasPermission(session.permissions, 'view_dashboard')) {
    redirect('/admin/no-access');
  }

  return <AnalyticsDashboardClient />;
}
