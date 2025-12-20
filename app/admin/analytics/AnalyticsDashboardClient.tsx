'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, TrendingUp, Users, Briefcase, RefreshCw } from 'lucide-react';
import TimeSeriesChart from '@/components/analytics/TimeSeriesChart';
import FunnelChart from '@/components/analytics/FunnelChart';
import SourceBreakdown from '@/components/analytics/SourceBreakdown';
import type { TimeGranularity } from '@/lib/analytics';

interface AnalyticsData {
  timeSeries: Array<{
    date: string;
    page_view: number;
    job_view: number;
    application_start: number;
    application_submit: number;
  }>;
  funnel: Array<{ eventType: string; count: number }>;
  sources: Array<{ source: string; count: number }>;
  topJobs: Array<{ jobId: string; jobTitle: string; views: number }>;
}

// Get date string in YYYY-MM-DD format
function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Default to last 30 days
function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: formatDateInput(start),
    endDate: formatDateInput(end),
  };
}

export default function AnalyticsDashboardClient() {
  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.startDate);
  const [endDate, setEndDate] = useState(defaultDates.endDate);
  const [granularity, setGranularity] = useState<TimeGranularity>('daily');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        granularity,
      });

      const res = await fetch(`/api/admin/analytics?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate summary stats from funnel data
  const getStat = (eventType: string): number => {
    if (!data) return 0;
    const item = data.funnel.find((f) => f.eventType === eventType);
    return item?.count || 0;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track visitor behavior and conversion metrics
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Granularity Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {(['daily', 'weekly', 'monthly'] as TimeGranularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  granularity === g
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Page Views"
          value={getStat('page_view')}
          icon={<TrendingUp className="w-5 h-5" />}
          color="indigo"
          loading={loading}
        />
        <StatCard
          title="Job Views"
          value={getStat('job_view')}
          icon={<Briefcase className="w-5 h-5" />}
          color="violet"
          loading={loading}
        />
        <StatCard
          title="Applications Started"
          value={getStat('application_start')}
          icon={<Users className="w-5 h-5" />}
          color="amber"
          loading={loading}
        />
        <StatCard
          title="Applications Submitted"
          value={getStat('application_submit')}
          icon={<Users className="w-5 h-5" />}
          color="emerald"
          loading={loading}
        />
      </div>

      {/* Time Series Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Events Over Time</h2>
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading chart...</div>
          </div>
        ) : (
          <TimeSeriesChart data={data?.timeSeries || []} />
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading funnel...</div>
            </div>
          ) : (
            <FunnelChart data={data?.funnel || []} />
          )}
        </div>

        {/* Traffic Sources */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Loading sources...</div>
            </div>
          ) : (
            <SourceBreakdown data={data?.sources || []} />
          )}
        </div>
      </div>

      {/* Top Jobs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Viewed Jobs</h2>
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Loading jobs...</div>
          </div>
        ) : data?.topJobs && data.topJobs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {data.topJobs.map((job, index) => (
                  <tr key={job.jobId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      #{index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.jobTitle || 'Unknown Job'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                      {job.views.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No job view data available</div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'indigo' | 'violet' | 'amber' | 'emerald';
  loading?: boolean;
}

const colorClasses = {
  indigo: 'bg-indigo-100 text-indigo-600',
  violet: 'bg-violet-100 text-violet-600',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
};

function StatCard({ title, value, icon, color, loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          {loading ? (
            <div className="h-7 w-16 bg-gray-200 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
