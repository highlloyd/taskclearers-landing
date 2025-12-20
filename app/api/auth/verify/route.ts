import { NextResponse } from 'next/server';
import { verifyMagicLinkToken, createSession } from '@/lib/auth';
import { cookies, headers } from 'next/headers';
import { checkRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';

function getClientIp(headersList: Headers): string {
  return (
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: Request) {
  try {
    const headersList = await headers();
    const clientIp = getClientIp(headersList);

    // Check global IP rate limit
    const ipLimit = checkRateLimit(`ip:${clientIp}`, RATE_LIMITS.globalIp);
    if (!ipLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check email-specific rate limit for verification attempts
    const verifyLimit = checkRateLimit(`verify:${normalizedEmail}`, RATE_LIMITS.verify);
    if (!verifyLimit.success) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please request a new code.' },
        { status: 429 }
      );
    }

    const isValid = await verifyMagicLinkToken(normalizedEmail, token.toUpperCase().trim());

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const jwt = await createSession(normalizedEmail);

    const cookieStore = await cookies();
    cookieStore.set('session', jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}