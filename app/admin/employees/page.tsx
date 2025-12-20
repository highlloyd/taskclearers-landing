import { db, employees, jobs } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import EmployeesClient from './EmployeesClient';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const allEmployees = await db
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
    .orderBy(desc(employees.createdAt));

  // Get unique departments for filter dropdown
  const departmentsResult = await db
    .selectDistinct({ department: employees.department })
    .from(employees)
    .orderBy(employees.department);

  const departments = departmentsResult.map((d) => d.department);

  return (
    <EmployeesClient
      initialEmployees={allEmployees}
      departments={departments}
    />
  );
}
