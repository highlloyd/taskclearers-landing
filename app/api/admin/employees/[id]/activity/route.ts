import { NextResponse } from 'next/server';
import { db, employeeActivityLog, adminUsers } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { eq, desc } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const activities = await db
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
      .limit(limit);

    // Parse JSON fields
    const parsedActivities = activities.map((activity) => ({
      ...activity,
      previousValue: activity.previousValue ? JSON.parse(activity.previousValue) : null,
      newValue: activity.newValue ? JSON.parse(activity.newValue) : null,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
    }));

    return NextResponse.json(parsedActivities);
  } catch (err) {
    console.error('Failed to fetch activity log:', err);
    return NextResponse.json({ error: 'Failed to fetch activity log' }, { status: 500 });
  }
}
