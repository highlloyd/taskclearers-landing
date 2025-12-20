import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { db, employees, jobs } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logEmployeeActivity } from '@/lib/db/activity-logger';
import { eq, desc, like, or, and, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_EMPLOYEES);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const search = searchParams.get('search');

    // Build conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(employees.status, status));
    }

    if (department) {
      conditions.push(eq(employees.department, department));
    }

    if (search) {
      conditions.push(
        or(
          like(employees.firstName, `%${search}%`),
          like(employees.lastName, `%${search}%`),
          like(employees.email, `%${search}%`)
        )
      );
    }

    const result = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        phone: employees.phone,
        department: employees.department,
        role: employees.role,
        hireDate: employees.hireDate,
        status: employees.status,
        createdAt: employees.createdAt,
        jobTitle: jobs.title,
      })
      .from(employees)
      .leftJoin(jobs, eq(employees.jobId, jobs.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(employees.createdAt));

    // Get unique departments for filter dropdown
    const departments = await db
      .selectDistinct({ department: employees.department })
      .from(employees)
      .orderBy(employees.department);

    return NextResponse.json({
      employees: result,
      departments: departments.map((d) => d.department),
    });
  } catch (err) {
    console.error('Failed to fetch employees:', err);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_EMPLOYEES);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      department,
      role,
      jobId,
      hireDate,
      salary,
      benefits,
      address,
      emergencyContact,
      applicationId,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !department || !role || !hireDate) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, department, role, hireDate' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'An employee with this email already exists' }, { status: 400 });
    }

    const employeeId = nanoid();
    await db.insert(employees).values({
      id: employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      department: department.trim(),
      role: role.trim(),
      jobId: jobId || null,
      hireDate: new Date(hireDate),
      salary: salary ? JSON.stringify(salary) : null,
      benefits: benefits ? JSON.stringify(benefits) : null,
      address: address ? JSON.stringify(address) : null,
      emergencyContact: emergencyContact ? JSON.stringify(emergencyContact) : null,
      applicationId: applicationId || null,
      status: 'active',
      createdBy: session!.user.id,
    });

    // Log activity
    await logEmployeeActivity({
      employeeId,
      adminUserId: session!.user.id,
      action: 'created',
      metadata: {
        source: applicationId ? 'from_application' : 'manual',
        applicationId: applicationId || undefined,
      },
    });

    revalidatePath('/admin/employees');

    return NextResponse.json({ success: true, id: employeeId });
  } catch (err) {
    console.error('Failed to create employee:', err);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
