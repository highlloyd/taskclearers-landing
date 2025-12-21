import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession, hasAnyPermission, Permission } from '@/lib/auth';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

// Pages that don't require authentication or sidebar
const publicPaths = ['/admin/login', '/admin/verify'];
// Pages that show sidebar but don't require specific permissions
const noSidebarPaths = ['/admin/no-access'];

// Route to permission mapping (checked with fresh DB data)
const ROUTE_PERMISSIONS: Record<string, Permission[]> = {
  '/admin': ['view_dashboard'],
  '/admin/analytics': ['view_dashboard'],
  '/admin/applications': ['view_applications'],
  '/admin/jobs': ['view_jobs'],
  '/admin/employees': ['view_employees'],
  '/admin/sales': ['view_sales_leads'],
  '/admin/users': ['manage_users'],
};

// Get required permissions for a route
function getRoutePermissions(pathname: string): Permission[] {
  // Check exact match first
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }
  // Check parent routes for dynamic segments
  for (const [route, perms] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route + '/')) {
      return perms;
    }
  }
  return [];
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';

  // Check if current path is a public auth page
  const isPublicPage = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPage) {
    return <>{children}</>;
  }

  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  // Check route permissions (uses fresh permissions from DB)
  const requiredPermissions = getRoutePermissions(pathname);
  if (
    requiredPermissions.length > 0 &&
    !hasAnyPermission(session.permissions, requiredPermissions)
  ) {
    redirect('/admin/no-access');
  }

  // Check if this is a no-sidebar page
  const isNoSidebarPage = noSidebarPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isNoSidebarPage) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </div>
    );
  }

  return (
    <AdminLayoutClient
      user={{ name: session.user.name, email: session.user.email }}
      permissions={session.permissions}
    >
      {children}
    </AdminLayoutClient>
  );
}
