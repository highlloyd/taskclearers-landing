import { NextResponse } from 'next/server';
import { getSession, logout } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      await logout(session.sessionId);
    }

    const cookieStore = await cookies();
    cookieStore.delete('session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
