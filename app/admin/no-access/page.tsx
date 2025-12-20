import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NoAccessClient from './NoAccessClient';

export default async function NoAccessPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  return <NoAccessClient email={session.user.email} />;
}
