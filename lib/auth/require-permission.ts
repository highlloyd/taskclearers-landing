import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Permission, hasPermission, hasAnyPermission } from './permissions';
import { adminUsers } from '@/lib/db/schema';

type SessionResult = {
  error?: NextResponse;
  session?: {
    user: typeof adminUsers.$inferSelect;
    sessionId: string;
    permissions: Permission[];
  };
};

export async function requirePermission(
  permission: Permission
): Promise<SessionResult> {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasPermission(session.permissions, permission)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { session };
}

export async function requireAnyPermission(
  permissions: Permission[]
): Promise<SessionResult> {
  const session = await getSession();

  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!hasAnyPermission(session.permissions, permissions)) {
    return {
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { session };
}
