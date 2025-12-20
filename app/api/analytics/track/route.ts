import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { EVENT_TYPES, EventMetadata } from '@/lib/analytics';
import { trackEvent, hashIP, extractDomain, getClientIP } from '@/lib/analytics/tracking';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventType, jobId, metadata = {} } = body;

    // Validate event type
    const validTypes = Object.values(EVENT_TYPES);
    if (!validTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
    }

    // Get client IP for hashing
    const headersList = await headers();
    const clientIp = getClientIP(headersList);
    const ipHash = hashIP(clientIp);

    // Process referrer if present
    const processedMetadata: EventMetadata = { ...metadata };
    if (metadata.referrer) {
      processedMetadata.referrer_domain = extractDomain(metadata.referrer);
    }

    await trackEvent(eventType, processedMetadata, { jobId, ipHash });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track event:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
