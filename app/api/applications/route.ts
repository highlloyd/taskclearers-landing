import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { headers } from 'next/headers';
import { db, applications, jobs } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { saveFile } from '@/lib/upload';
import { sendNewApplicationNotification } from '@/lib/email';
import { checkRateLimit, RATE_LIMITS } from '@/lib/auth/rate-limit';
import { trackEvent, hashIP, getClientIP } from '@/lib/analytics/tracking';
import { EVENT_TYPES } from '@/lib/analytics';

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // Check per-IP rate limit
    const ipRateLimit = checkRateLimit(
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

    // Check global rate limit (DDoS protection)
    const globalRateLimit = checkRateLimit(
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

    const jobId = formData.get('jobId') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const coverLetter = formData.get('coverLetter') as string;
    const goodAt = formData.get('goodAt') as string;
    const resume = formData.get('resume') as File | null;

    // Validate required fields
    if (!jobId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
