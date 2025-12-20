import { NextResponse } from 'next/server';
import { getSession, AdminUser } from './index';

interface AuthContext {
  user: AdminUser;
  sessionId: string;
}

export async function withAuth(
  handler: (req: Request, context: AuthContext) => Promise<Response>
) {
  return async (req: Request) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, { user: session.user, sessionId: session.sessionId });
  };
}
