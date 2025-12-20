import { NextResponse } from 'next/server';
import { db, analyticsEvents, jobs } from '@/lib/db';
import { requirePermission } from '@/lib/auth/require-permission';
import { PERMISSIONS } from '@/lib/auth/permissions';
import { sql, eq, gte, lte, and, count, desc } from 'drizzle-orm';
import type { TimeGranularity } from '@/lib/analytics';

export async function GET(request: Request) {
  const { error } = await requirePermission(PERMISSIONS.VIEW_DASHBOARD);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = (searchParams.get('granularity') || 'daily') as TimeGranularity;

    // Build date filter conditions
    const conditions = [];
    if (startDate) {
      conditions.push(gte(analyticsEvents.createdAt, new Date(startDate)));
    }
    if (endDate) {
      // Include the entire end date by setting to end of day
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(analyticsEvents.createdAt, endOfDay));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Date format for SQLite grouping
    const dateFormat =
      granularity === 'daily'
        ? '%Y-%m-%d'
        : granularity === 'weekly'
          ? '%Y-W%W'
          : '%Y-%m';

    // Get time series data grouped by date and event type
    const timeSeries = await db
      .select({
        date: sql<string>`strftime('${sql.raw(dateFormat)}', datetime(${analyticsEvents.createdAt}/1000, 'unixepoch'))`.as('date'),
        eventType: analyticsEvents.eventType,
        count: count(),
      })
      .from(analyticsEvents)
      .where(whereClause)
      .groupBy(
        sql`strftime('${sql.raw(dateFormat)}', datetime(${analyticsEvents.createdAt}/1000, 'unixepoch'))`,
        analyticsEvents.eventType
      )
      .orderBy(
        sql`strftime('${sql.raw(dateFormat)}', datetime(${analyticsEvents.createdAt}/1000, 'unixepoch'))`
      );

    // Get funnel data (total counts per event type)
    const funnelData = await db
      .select({
        eventType: analyticsEvents.eventType,
        count: count(),
      })
      .from(analyticsEvents)
      .where(whereClause)
      .groupBy(analyticsEvents.eventType);

    // Get source data from metadata JSON
    const sourceData = await db
      .select({
        metadata: analyticsEvents.metadata,
      })
      .from(analyticsEvents)
      .where(whereClause);

    // Aggregate sources in JavaScript (SQLite JSON support is limited)
    const sourceCounts: Record<string, number> = {};
    sourceData.forEach((row) => {
      if (row.metadata) {
        try {
          const meta = JSON.parse(row.metadata);
          const source = meta.utm_source || meta.referrer_domain || 'direct';
          sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        } catch {
          // Skip invalid JSON
        }
      } else {
        sourceCounts['direct'] = (sourceCounts['direct'] || 0) + 1;
      }
    });

    // Get top jobs by views
    const topJobs = await db
      .select({
        jobId: analyticsEvents.jobId,
        jobTitle: jobs.title,
        views: count(),
      })
      .from(analyticsEvents)
      .leftJoin(jobs, eq(analyticsEvents.jobId, jobs.id))
      .where(
        conditions.length > 0
          ? and(eq(analyticsEvents.eventType, 'job_view'), ...conditions)
          : eq(analyticsEvents.eventType, 'job_view')
      )
      .groupBy(analyticsEvents.jobId, jobs.title)
      .orderBy(desc(count()))
      .limit(10);

    // Transform time series data for chart consumption
    const timeSeriesMap = new Map<
      string,
      { date: string; page_view: number; job_view: number; application_start: number; application_submit: number }
    >();

    timeSeries.forEach((row) => {
      if (!timeSeriesMap.has(row.date)) {
        timeSeriesMap.set(row.date, {
          date: row.date,
          page_view: 0,
          job_view: 0,
          application_start: 0,
          application_submit: 0,
        });
      }
      const entry = timeSeriesMap.get(row.date)!;
      if (row.eventType === 'page_view') entry.page_view = row.count;
      else if (row.eventType === 'job_view') entry.job_view = row.count;
      else if (row.eventType === 'application_start') entry.application_start = row.count;
      else if (row.eventType === 'application_submit') entry.application_submit = row.count;
    });

    return NextResponse.json({
      timeSeries: Array.from(timeSeriesMap.values()),
      funnel: funnelData,
      sources: Object.entries(sourceCounts)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topJobs: topJobs.filter((j) => j.jobId !== null),
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
