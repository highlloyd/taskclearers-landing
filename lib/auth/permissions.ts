// All available permissions in the system
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_APPLICATIONS: 'view_applications',
  MANAGE_APPLICATIONS: 'manage_applications',
  SEND_EMAILS: 'send_emails',
  VIEW_JOBS: 'view_jobs',
  MANAGE_JOBS: 'manage_jobs',
  VIEW_EMPLOYEES: 'view_employees',
  MANAGE_EMPLOYEES: 'manage_employees',
  VIEW_SALES_LEADS: 'view_sales_leads',
  MANAGE_SALES_LEADS: 'manage_sales_leads',
  EXPORT_DATA: 'export_data',
  MANAGE_USERS: 'manage_users',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// All permissions for super admin
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

// Permission groups for UI organization
export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Dashboard: [PERMISSIONS.VIEW_DASHBOARD],
  Applications: [
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.MANAGE_APPLICATIONS,
    PERMISSIONS.SEND_EMAILS,
  ],
  Jobs: [PERMISSIONS.VIEW_JOBS, PERMISSIONS.MANAGE_JOBS],
  Employees: [PERMISSIONS.VIEW_EMPLOYEES, PERMISSIONS.MANAGE_EMPLOYEES],
  Sales: [PERMISSIONS.VIEW_SALES_LEADS, PERMISSIONS.MANAGE_SALES_LEADS],
  System: [PERMISSIONS.EXPORT_DATA, PERMISSIONS.MANAGE_USERS],
};

// Human-readable labels for UI
export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.VIEW_DASHBOARD]: 'View Dashboard',
  [PERMISSIONS.VIEW_APPLICATIONS]: 'View Applications',
  [PERMISSIONS.MANAGE_APPLICATIONS]: 'Manage Applications',
  [PERMISSIONS.SEND_EMAILS]: 'Send Emails',
  [PERMISSIONS.VIEW_JOBS]: 'View Jobs',
  [PERMISSIONS.MANAGE_JOBS]: 'Manage Jobs',
  [PERMISSIONS.VIEW_EMPLOYEES]: 'View Employees',
  [PERMISSIONS.MANAGE_EMPLOYEES]: 'Manage Employees',
  [PERMISSIONS.VIEW_SALES_LEADS]: 'View Sales Leads',
  [PERMISSIONS.MANAGE_SALES_LEADS]: 'Manage Sales Leads',
  [PERMISSIONS.EXPORT_DATA]: 'Export Data',
  [PERMISSIONS.MANAGE_USERS]: 'Manage Users',
};

// Parse permissions from JSON column
export function parsePermissions(permissionsJson: string | null): Permission[] {
  if (!permissionsJson) return [];
  try {
    const parsed = JSON.parse(permissionsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is Permission =>
      ALL_PERMISSIONS.includes(p as Permission)
    );
  } catch {
    return [];
  }
}

// Check if user has a specific permission
export function hasPermission(
  userPermissions: Permission[],
  required: Permission
): boolean {
  return userPermissions.includes(required);
}

// Check if user has any of the required permissions
export function hasAnyPermission(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.some((p) => userPermissions.includes(p));
}

// Check if user has all of the required permissions
export function hasAllPermissions(
  userPermissions: Permission[],
  required: Permission[]
): boolean {
  return required.every((p) => userPermissions.includes(p));
}
