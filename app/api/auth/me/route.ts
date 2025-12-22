import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const hasSessionCookie = !!cookieStore.get('session')?.value;
    const session = await getSession();

    if (!session) {
      const response = NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      // Clear stale cookie if present (session was invalidated but cookie remains)
      if (hasSessionCookie) {
        response.cookies.delete('session');
      }
      return response;
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
