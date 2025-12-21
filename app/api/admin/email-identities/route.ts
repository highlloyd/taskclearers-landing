import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { getEmailIdentities, getDefaultIdentity, type EmailIdentityConfig } from '@/lib/email/microsoft-graph';

// GET /api/admin/email-identities - Get available email identities
export async function GET(request: Request) {
  const { error, session } = await requirePermission(PERMISSIONS.VIEW_APPLICATIONS);
  if (error) return error;

  try {
    const url = new URL(request.url);
    const context = url.searchParams.get('context') as 'admin' | 'sales' | 'hiring' | 'notification' | null;

    const identities = getEmailIdentities();
    const defaultIdentity = context ? getDefaultIdentity(context) : identities[0] || null;

    // Build the identities list
    const identityList = identities.map((identity: EmailIdentityConfig) => ({
      id: identity.id,
      email: identity.email,
      name: identity.name,
      label: identity.label,
    }));

    // Add the current user's email as a personal identity option if it's not already in the list
    const userEmail = session?.user.email;
    const userName = session?.user.name || userEmail?.split('@')[0] || 'User';

    if (userEmail && !identityList.some(i => i.email.toLowerCase() === userEmail.toLowerCase())) {
      identityList.unshift({
        id: 'personal',
        email: userEmail,
        name: userName,
        label: `${userName} (Personal)`,
      });
    }

    return NextResponse.json({
      identities: identityList,
      default: defaultIdentity ? defaultIdentity.email : null,
    });
  } catch (err) {
    console.error('Failed to get email identities:', err);
    return NextResponse.json({ error: 'Failed to get email identities' }, { status: 500 });
  }
}
