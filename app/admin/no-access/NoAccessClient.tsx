'use client';

import { useRouter } from 'next/navigation';
import { ShieldOff, LogOut } from 'lucide-react';

interface Props {
  email: string;
}

export default function NoAccessClient({ email }: Props) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldOff className="w-8 h-8 text-yellow-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Pending</h1>
        <p className="text-gray-600 mb-2">
          You&apos;ve successfully logged in as{' '}
          <span className="font-medium text-gray-900">{email}</span>
        </p>
        <p className="text-gray-600 mb-8">
          An administrator needs to grant you permissions before you can access
          the admin panel. Please contact your team lead or administrator.
        </p>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
