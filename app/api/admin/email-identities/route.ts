import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { getEmailIdentities, getDefaultIdentity, type EmailIdentityConfig } from '@/lib/email/microsoft-graph';

// GET /api/admin/email-identities - Get available email identities
export async function GET(request: Request) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_APPLICATIONS);
  if (error) return error;

  try {
    const url = new URL(request.url);
    const context = url.searchParams.get('context') as 'admin' | 'sales' | 'hiring' | 'notification' | null;

    const identities = getEmailIdentities();
    const defaultIdentity = context ? getDefaultIdentity(context) : identities[0] || null;

    return NextResponse.json({
      identities: identities.map((identity: EmailIdentityConfig) => ({
        id: identity.id,
        email: identity.email,
        name: identity.name,
        label: identity.label,
      })),
      default: defaultIdentity ? defaultIdentity.email : null,
    });
  } catch (err) {
    console.error('Failed to get email identities:', err);
    return NextResponse.json({ error: 'Failed to get email identities' }, { status: 500 });
  }
}
