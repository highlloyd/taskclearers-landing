import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db, employees, jobs, adminUsers, employeeDocuments, employeeNotes, employeeActivityLog } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { logEmployeeActivity, logEmployeeFieldChanges } from '@/lib/db/activity-logger';
import { eq, desc } from 'drizzle-orm';

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: Context) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;

    const [employee] = await db
      .select({
        id: employees.id,
        applicationId: employees.applicationId,
        firstName: employees.firstName,
        lastName: employees.lastName,
        email: employees.email,
        phone: employees.phone,
        department: employees.department,
        role: employees.role,
        jobId: employees.jobId,
        hireDate: employees.hireDate,
        salary: employees.salary,
        benefits: employees.benefits,
        address: employees.address,
        emergencyContact: employees.emergencyContact,
        status: employees.status,
        terminationDate: employees.terminationDate,
        terminationReason: employees.terminationReason,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        createdBy: employees.createdBy,
        jobTitle: jobs.title,
        jobDepartment: jobs.department,
        createdByName: adminUsers.name,
        createdByEmail: adminUsers.email,
      })
      .from(employees)
      .leftJoin(jobs, eq(employees.jobId, jobs.id))
      .leftJoin(adminUsers, eq(employees.createdBy, adminUsers.id))
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Parse JSON fields with error handling
    const safeJsonParse = (value: string | null): unknown => {
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        console.error('Failed to parse JSON field in employee record');
        return null;
      }
    };

    const parsedEmployee = {
      ...employee,
      salary: safeJsonParse(employee.salary),
      benefits: safeJsonParse(employee.benefits),
      address: safeJsonParse(employee.address),
      emergencyContact: safeJsonParse(employee.emergencyContact),
    };

    return NextResponse.json(parsedEmployee);
  } catch (err) {
    console.error('Failed to fetch employee:', err);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await request.json();

    // Fetch current employee data for comparison
    const [current] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!current) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Build update object and track changes
    const updates: Record<string, unknown> = {};
    const changes: Array<{ field: string; previousValue: unknown; newValue: unknown }> = [];

    const fields = [
      'firstName', 'lastName', 'email', 'phone', 'department', 'role',
      'jobId', 'hireDate', 'salary', 'benefits', 'address', 'emergencyContact',
      'status', 'terminationDate', 'terminationReason'
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        let newValue = body[field];
        let oldValue = current[field as keyof typeof current];

        // Handle JSON fields
        if (['salary', 'benefits', 'address', 'emergencyContact'].includes(field)) {
          newValue = newValue ? JSON.stringify(newValue) : null;
          // oldValue is already a string from the DB
        }

        // Handle date fields
        if (['hireDate', 'terminationDate'].includes(field) && newValue) {
          newValue = new Date(newValue);
        }

        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
          updates[field] = newValue;

          // For activity log, use readable values
          let logOldValue = oldValue;
          if (['salary', 'benefits', 'address', 'emergencyContact'].includes(field) && oldValue) {
            try {
              logOldValue = JSON.parse(oldValue as string);
            } catch {
              logOldValue = null;
            }
          }
          const logNewValue = body[field];

          // Special handling for status changes
          if (field === 'status') {
            await logEmployeeActivity({
              employeeId: id,
              adminUserId: session!.user.id,
              action: 'status_changed',
              previousValue: oldValue,
              newValue: body[field],
            });
          } else {
            changes.push({
              field,
              previousValue: logOldValue,
              newValue: logNewValue,
            });
          }
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: true, message: 'No changes detected' });
    }

    // Always update the updatedAt timestamp
    updates.updatedAt = new Date();

    await db.update(employees).set(updates).where(eq(employees.id, id));

    // Log field changes
    if (changes.length > 0) {
      await logEmployeeFieldChanges(id, session!.user.id, changes);
    }

    revalidatePath(`/admin/employees/${id}`);
    revalidatePath('/admin/employees');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update employee:', err);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: Context) {
  const { error, session } = await requirePermission(PERMISSIONS.MANAGE_EMPLOYEES);
  if (error) return error;

  try {
    const { id } = await context.params;

    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Soft delete: set status to terminated
    await db.update(employees).set({
      status: 'terminated',
      terminationDate: new Date(),
      updatedAt: new Date(),
    }).where(eq(employees.id, id));

    await logEmployeeActivity({
      employeeId: id,
      adminUserId: session!.user.id,
      action: 'status_changed',
      previousValue: employee.status,
      newValue: 'terminated',
      metadata: { reason: 'Deleted via admin panel' },
    });

    revalidatePath(`/admin/employees/${id}`);
    revalidatePath('/admin/employees');

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete employee:', err);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
