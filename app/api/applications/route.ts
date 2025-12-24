import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { headers } from 'next/headers';
import { db, applications, jobs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { saveFile } from '@/lib/upload';
import { sendNewApplicationNotification } from '@/lib/email';
import { checkRateLimitAsync, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { trackEvent, hashIP, getClientIP } from '@/lib/analytics/tracking';
import { EVENT_TYPES } from '@/lib/analytics';

// Input validation constants
const MAX_FIELD_LENGTH = 500;
const MAX_COVER_LETTER_LENGTH = 10000;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d\s\-()]{0,30}$/;
const NANOID_REGEX = /^[A-Za-z0-9_-]{21}$/;

// Sanitize string input to prevent XSS and limit length
function sanitizeString(input: string | null, maxLength: number): string {
  if (!input) return '';
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove basic XSS characters
    .trim();
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Check per-IP rate limit (uses Redis if available)
    const ipRateLimit = await checkRateLimitAsync(
      `application:${clientIp}`,
      RATE_LIMITS.application
    );
    if (!ipRateLimit.success) {
      const retryAfter = Math.ceil((ipRateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        { error: 'Too many applications. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) }
        }
      );
    }

    // Check global rate limit (DDoS protection, uses Redis if available)
    const globalRateLimit = await checkRateLimitAsync(
      'application:global',
      RATE_LIMITS.applicationGlobal
    );
    if (!globalRateLimit.success) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    const formData = await request.formData();

    const jobIdRaw = formData.get('jobId') as string;
    const firstNameRaw = formData.get('firstName') as string;
    const lastNameRaw = formData.get('lastName') as string;
    const emailRaw = formData.get('email') as string;
    const phoneRaw = formData.get('phone') as string;
    const coverLetterRaw = formData.get('coverLetter') as string;
    const goodAtRaw = formData.get('goodAt') as string;
    const resume = formData.get('resume') as File | null;

    // Validate required fields
    if (!jobIdRaw || !firstNameRaw || !lastNameRaw || !emailRaw) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate job ID format (nanoid format)
    if (!NANOID_REGEX.test(jobIdRaw)) {
      return NextResponse.json(
        { error: 'Invalid job ID format' },
        { status: 400 }
      );
    }

    // Sanitize and validate inputs
    const jobId = jobIdRaw;
    const firstName = sanitizeString(firstNameRaw, MAX_FIELD_LENGTH);
    const lastName = sanitizeString(lastNameRaw, MAX_FIELD_LENGTH);
    const email = emailRaw.toLowerCase().trim().slice(0, MAX_FIELD_LENGTH);
    const phone = sanitizeString(phoneRaw, 30);
    const coverLetter = sanitizeString(coverLetterRaw, MAX_COVER_LETTER_LENGTH);
    const goodAt = sanitizeString(goodAtRaw, MAX_COVER_LETTER_LENGTH);

    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format if provided
    if (phone && !PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate name lengths
    if (firstName.length < 1 || lastName.length < 1) {
      return NextResponse.json(
        { error: 'Name fields cannot be empty' },
        { status: 400 }
      );
    }

    // Verify job exists
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Handle file upload
    let resumePath: string | null = null;
    if (resume && resume.size > 0) {
      try {
        resumePath = await saveFile(resume);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Failed to upload resume' },
          { status: 400 }
        );
      }
    }

    // Create application
    const applicationId = nanoid();
    await db.insert(applications).values({
      id: applicationId,
      jobId,
      firstName,
      lastName,
      email,
      phone: phone || null,
      resumePath,
      coverLetter: coverLetter || null,
      goodAt: goodAt || null,
      status: 'new',
    });

    // Track application submission
    await trackEvent(
      EVENT_TYPES.APPLICATION_SUBMIT,
      { application_id: applicationId },
      { jobId, ipHash: hashIP(clientIp) }
    );

    // Send notification email
    try {
      await sendNewApplicationNotification(job.title, `${firstName} ${lastName}`, email);
    } catch (error) {
      console.error('Failed to send notification:', error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      id: applicationId,
    });
  } catch (error) {
    console.error('Failed to submit application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
