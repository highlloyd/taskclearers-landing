import { db, adminUsers } from '@/lib/db';
import { getSession, hasPermission, PERMISSIONS, parsePermissions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { desc } from 'drizzle-orm';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  if (!hasPermission(session.permissions, PERMISSIONS.MANAGE_USERS)) {
    redirect('/admin/no-access');
  }

  const users = await db
    .select()
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));

  const usersWithPermissions = users.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    permissions: parsePermissions(u.permissions),
    isPending: !u.permissions || parsePermissions(u.permissions).length === 0,
    lastLoginAt: u.lastLoginAt?.toISOString() || null,
    createdAt: u.createdAt?.toISOString() || null,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">
          Manage admin users and their permissions
        </p>
      </div>
      <UsersClient users={usersWithPermissions} currentUserId={session.user.id} />
    </div>
  );
}
