'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ShieldOff, Check, X, AlertCircle } from 'lucide-react';
import {
  Permission,
  PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  ALL_PERMISSIONS,
} from '@/lib/auth/permissions';

interface UserData {
  id: string;
  email: string;
  name: string | null;
  permissions: Permission[];
  isPending: boolean;
  lastLoginAt: string | null;
  createdAt: string | null;
}

interface Props {
  users: UserData[];
  currentUserId: string;
}

export default function UsersClient({ users, currentUserId }: Props) {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editPermissions, setEditPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const pendingUsers = users.filter((u) => u.isPending);
  const activeUsers = users.filter((u) => !u.isPending);

  const handleEdit = (user: UserData) => {
    setEditingUser(user.id);
    setEditPermissions([...user.permissions]);
    setError(null);
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditPermissions([]);
    setError(null);
  };

  const handleTogglePermission = (permission: Permission) => {
    setEditPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: editPermissions }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to update permissions');
        return;
      }

      setEditingUser(null);
      router.refresh();
    } catch {
      setError('Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAll = () => {
    setEditPermissions([...ALL_PERMISSIONS]);
  };

  const handleRevokeAll = () => {
    // Keep manage_users if editing yourself
    if (editingUser === currentUserId) {
      setEditPermissions([PERMISSIONS.MANAGE_USERS]);
    } else {
      setEditPermissions([]);
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user? They will lose all permissions.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to deactivate user');
        return;
      }

      router.refresh();
    } catch {
      alert('Failed to deactivate user');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderPermissionEditor = (userId: string) => (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      <div className="flex gap-3 mb-3">
        <button
          onClick={handleGrantAll}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Grant All
        </button>
        <button
          onClick={handleRevokeAll}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Revoke All
        </button>
      </div>
      {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
        <div key={group}>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {group}
          </p>
          <div className="flex flex-wrap gap-2">
            {perms.map((perm) => {
              const isDisabled =
                perm === PERMISSIONS.MANAGE_USERS && userId === currentUserId;
              const isSelected = editPermissions.includes(perm);
              return (
                <button
                  key={perm}
                  onClick={() => !isDisabled && handleTogglePermission(perm)}
                  disabled={isDisabled}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={isDisabled ? "Can't remove this permission from yourself" : ''}
                >
                  {PERMISSION_LABELS[perm]}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => handleSave(userId)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? (
            'Saving...'
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Permissions
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderUserRow = (user: UserData) => (
    <div
      key={user.id}
      className={`bg-white rounded-lg shadow ${
        user.isPending ? 'ring-2 ring-yellow-200' : ''
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium ${
                user.isPending ? 'bg-yellow-500' : 'bg-green-600'
              }`}
            >
              {(user.name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {user.name || user.email.split('@')[0]}
                {user.id === currentUserId && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    (you)
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Last login: {formatDate(user.lastLoginAt)}
              </p>
            </div>
          </div>
          {editingUser !== user.id && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(user)}
                className="px-3 py-1.5 text-sm text-green-600 hover:text-green-700 font-medium"
              >
                Edit Permissions
              </button>
              {user.id !== currentUserId && !user.isPending && (
                <button
                  onClick={() => handleDeactivate(user.id)}
                  className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Deactivate
                </button>
              )}
            </div>
          )}
        </div>

        {editingUser === user.id ? (
          renderPermissionEditor(user.id)
        ) : user.isPending ? (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg text-yellow-700 text-sm">
            <ShieldOff className="w-4 h-4" />
            No permissions granted yet
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((perm) => (
              <span
                key={perm}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-green-100 text-green-800 rounded-full"
              >
                <Shield className="w-3 h-3" />
                {PERMISSION_LABELS[perm]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {pendingUsers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <ShieldOff className="w-5 h-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Users ({pendingUsers.length})
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These users have logged in but don&apos;t have any permissions yet.
            Grant them access to the admin panel.
          </p>
          <div className="space-y-4">
            {pendingUsers.map(renderUserRow)}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Active Users ({activeUsers.length})
          </h2>
        </div>
        {activeUsers.length === 0 ? (
          <p className="text-gray-500">No active users yet.</p>
        ) : (
          <div className="space-y-4">
            {activeUsers.map(renderUserRow)}
          </div>
        )}
      </div>
    </div>
  );
}
