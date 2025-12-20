import { NextResponse } from 'next/server';
import { createMagicLinkToken, isValidAdminEmail } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { checkRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { headers } from 'next/headers';

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

    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (!isValidAdminEmail(normalizedEmail)) {
      return NextResponse.json(
        { error: `Only @${process.env.ADMIN_EMAIL_DOMAIN || 'taskclearers.com'} emails are allowed` },
        { status: 400 }
      );
    }

    // Check email-specific rate limit
    const emailLimit = checkRateLimit(`login:${normalizedEmail}`, RATE_LIMITS.login);
    if (!emailLimit.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const token = await createMagicLinkToken(normalizedEmail);
    await sendMagicLinkEmail(normalizedEmail, token);

    return NextResponse.json({ success: true, message: 'Magic code sent to your email' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 });
  }
}
