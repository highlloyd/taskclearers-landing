'use client';

import React, { createContext, useContext, useEffect, useRef, useCallback, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface AnalyticsContextType {
  trackEvent: (eventType: string, metadata?: Record<string, string>, jobId?: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

/**
 * Generate or retrieve session ID from sessionStorage
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Extract UTM parameters from URL search params
 */
function getUTMParams(searchParams: ReturnType<typeof useSearchParams>): Record<string, string> {
  const utmParams: Record<string, string> = {};
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
  keys.forEach((key) => {
    const value = searchParams.get(key);
    if (value) utmParams[key] = value;
  });
  return utmParams;
}

function AnalyticsProviderInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string>('');

  const trackEvent = useCallback(
    async (
      eventType: string,
      additionalMetadata: Record<string, string> = {},
      jobId?: string
    ) => {
      // Build metadata with UTM params, referrer, and page path
      const metadata: Record<string, string> = {
        ...getUTMParams(searchParams),
        page_path: pathname,
        session_id: getSessionId(),
        ...additionalMetadata,
      };

      // Add referrer if available
      if (typeof document !== 'undefined' && document.referrer) {
        metadata.referrer = document.referrer;
      }

      try {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType, jobId, metadata }),
        });
      } catch (error) {
        console.error('Analytics tracking failed:', error);
      }
    },
    [pathname, searchParams]
  );

  // Auto-track page views on route change
  useEffect(() => {
    // Skip if pathname hasn't changed or is admin route
    if (pathname === lastPathRef.current || pathname.startsWith('/admin')) {
      return;
    }
    lastPathRef.current = pathname;
    trackEvent('page_view');
  }, [pathname, trackEvent]);

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AnalyticsProviderInner>{children}</AnalyticsProviderInner>
    </Suspense>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}
