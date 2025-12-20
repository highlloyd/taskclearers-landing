import { NextRequest, NextResponse } from 'next/server';
import { db, adminUsers, sessions } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import {
  PERMISSIONS,
  Permission,
  ALL_PERMISSIONS,
  parsePermissions,
} from '@/lib/auth/permissions';
import { eq } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] - Get single user
export async function GET(request: NextRequest, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (error) return error;

  const { id } = await context.params;
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...user,
    permissions: parsePermissions(user.permissions),
  });
}

// PATCH /api/admin/users/[id] - Update user permissions
export async function PATCH(request: NextRequest, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();
  const { permissions, name } = body;

  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);

  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Prevent removing manage_users from yourself
  if (
    id === session?.user.id &&
    Array.isArray(permissions) &&
    !permissions.includes(PERMISSIONS.MANAGE_USERS)
  ) {
    return NextResponse.json(
      { error: 'Cannot remove user management permission from yourself' },
      { status: 400 }
    );
  }

  // Validate permissions
  const validPermissions = (permissions || []).filter((p: string) =>
    ALL_PERMISSIONS.includes(p as Permission)
  );

  const updateData: Record<string, unknown> = {
    permissions: JSON.stringify(validPermissions),
  };

  if (name !== undefined) {
    updateData.name = name;
  }

  await db.update(adminUsers).set(updateData).where(eq(adminUsers.id, id));

  // Invalidate OTHER user's sessions to force re-login with new permissions
  // (your own session stays valid - permissions are checked from DB on each request)
  if (id !== session?.user.id) {
    await db.delete(sessions).where(eq(sessions.userId, id));
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users/[id] - Deactivate user (clear permissions)
export async function DELETE(request: NextRequest, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_USERS);
  if (error) return error;

  const { id } = await context.params;

  // Prevent self-deletion
  if (id === session?.user.id) {
    return NextResponse.json(
      { error: 'Cannot deactivate yourself' },
      { status: 400 }
    );
  }

  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);

  if (!existingUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Clear permissions and invalidate sessions
  await db
    .update(adminUsers)
    .set({ permissions: null })
    .where(eq(adminUsers.id, id));
  await db.delete(sessions).where(eq(sessions.userId, id));

  return NextResponse.json({ success: true });
}
