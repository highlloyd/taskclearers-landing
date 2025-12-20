import { NextResponse } from 'next/server';
import { db, adminUsers } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS, parsePermissions } from '@/lib/auth/permissions';
import { desc } from 'drizzle-orm';

// GET /api/admin/users - List all admin users
export async function GET() {
  const { error } = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (error) return error;

  const users = await db
    .select()
    .from(adminUsers)
    .orderBy(desc(adminUsers.createdAt));

  return NextResponse.json(
    users.map((u) => ({
      ...u,
      permissions: parsePermissions(u.permissions),
    }))
  );
}
