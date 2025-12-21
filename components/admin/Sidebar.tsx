'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Briefcase, LogOut, UserCog, BarChart2, Contact, TrendingUp } from 'lucide-react';
import type { Permission } from '@/lib/auth/permissions';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: Permission[];
};

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permissions: ['view_dashboard'],
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart2,
    permissions: ['view_dashboard'],
  },
  {
    name: 'Applications',
    href: '/admin/applications',
    icon: Users,
    permissions: ['view_applications'],
  },
  {
    name: 'Jobs',
    href: '/admin/jobs',
    icon: Briefcase,
    permissions: ['view_jobs'],
  },
  {
    name: 'Employees',
    href: '/admin/employees',
    icon: Contact,
    permissions: ['view_employees'],
  },
  {
    name: 'Sales',
    href: '/admin/sales',
    icon: TrendingUp,
    permissions: ['view_sales_leads'],
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: UserCog,
    permissions: ['manage_users'],
  },
];

interface SidebarProps {
  user: {
    name: string | null;
    email: string;
  };
  permissions: Permission[];
  onNavigate?: () => void;
}

export default function Sidebar({ user, permissions, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Filter navigation items based on user permissions
  const visibleNavigation = navigation.filter((item) =>
    item.permissions.some((p) => permissions.includes(p))
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 w-64">
      <div className="p-4 border-b border-gray-800">
        <Link href="/admin" className="text-xl font-bold text-white">
          TaskClearers
        </Link>
        <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {visibleNavigation.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">No access granted yet.</p>
            <p className="text-xs mt-1">Contact an administrator.</p>
          </div>
        ) : (
          visibleNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
            {(user.name || user.email)[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.name || user.email.split('@')[0]}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
