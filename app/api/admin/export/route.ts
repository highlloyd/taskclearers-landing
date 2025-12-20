import { NextResponse } from 'next/server';
import { db, applications, jobs } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { error } = await requirePermission(PERMISSIONS.EXPORT_DATA);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'applications') {
      const data = await db
        .select({
          firstName: applications.firstName,
          lastName: applications.lastName,
          email: applications.email,
          phone: applications.phone,
          status: applications.status,
          createdAt: applications.createdAt,
          jobTitle: jobs.title,
          jobDepartment: jobs.department,
        })
        .from(applications)
        .leftJoin(jobs, eq(applications.jobId, jobs.id))
        .orderBy(desc(applications.createdAt));

      // Convert to CSV
      const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Applied Date', 'Job Title', 'Department'];
      const rows = data.map((app) => [
        app.firstName,
        app.lastName,
        app.email,
        app.phone || '',
        app.status,
        app.createdAt?.toISOString() || '',
        app.jobTitle || '',
        app.jobDepartment || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
  } catch (error) {
    console.error('Failed to export:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
