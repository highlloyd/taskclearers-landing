// Event types
export const EVENT_TYPES = {
  PAGE_VIEW: 'page_view',
  JOB_VIEW: 'job_view',
  APPLICATION_START: 'application_start',
  APPLICATION_SUBMIT: 'application_submit',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

// Metadata stored in the JSON field
export interface EventMetadata {
  // UTM parameters
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;

  // Referrer tracking
  referrer?: string;
  referrer_domain?: string;

  // Page context
  page_path?: string;

  // Session tracking for funnel analysis
  session_id?: string;

  // Application context
  application_id?: string;
}

// Time granularity for aggregation
export type TimeGranularity = 'daily' | 'weekly' | 'monthly';

// Funnel stages configuration
export const FUNNEL_STAGES = [
  { key: 'page_view', label: 'Page Views' },
  { key: 'job_view', label: 'Job Views' },
  { key: 'application_start', label: 'Applications Started' },
  { key: 'application_submit', label: 'Applications Submitted' },
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];
