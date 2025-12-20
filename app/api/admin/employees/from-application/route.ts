import { NextResponse } from 'next/server';
import { db, applications, jobs } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_EMPLOYEES);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Fetch application with job details
    const [application] = await db
      .select({
        id: applications.id,
        firstName: applications.firstName,
        lastName: applications.lastName,
        email: applications.email,
        phone: applications.phone,
        status: applications.status,
        jobId: applications.jobId,
        jobTitle: jobs.title,
        jobDepartment: jobs.department,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.id, applicationId))
      .limit(1);

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'hired') {
      return NextResponse.json({ error: 'Only hired applications can be converted to employees' }, { status: 400 });
    }

    // Return pre-filled employee data
    return NextResponse.json({
      applicationId: application.id,
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.email,
      phone: application.phone || '',
      department: application.jobDepartment || '',
      role: application.jobTitle || '',
      jobId: application.jobId,
    });
  } catch (err) {
    console.error('Failed to fetch application for conversion:', err);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}
