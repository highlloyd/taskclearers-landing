import { createHash } from 'crypto';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { analyticsEvents } from '@/lib/db/schema';
import type { EventType, EventMetadata } from './index';

/**
 * Hash IP address for privacy-preserving analytics
 */
export function hashIP(ip: string): string {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return createHash('sha256')
    .update(ip + secret)
    .digest('hex')
    .slice(0, 16);
}

/**
 * Extract domain from a referrer URL
 */
export function extractDomain(referrer: string): string | undefined {
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

/**
 * Track an analytics event (server-side)
 */
export async function trackEvent(
  eventType: EventType,
  metadata: EventMetadata = {},
  options: { jobId?: string; ipHash?: string } = {}
): Promise<void> {
  try {
    await db.insert(analyticsEvents).values({
      id: nanoid(),
      eventType,
      jobId: options.jobId || null,
      metadata: JSON.stringify(metadata),
      ipHash: options.ipHash || null,
    });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
}
