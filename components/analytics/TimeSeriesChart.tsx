'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface TimeSeriesDataPoint {
  date: string;
  page_view: number;
  job_view: number;
  application_start: number;
  application_submit: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
}

const COLORS = {
  page_view: '#6366f1', // indigo
  job_view: '#8b5cf6', // violet
  application_start: '#f59e0b', // amber
  application_submit: '#10b981', // emerald
};

const LABELS = {
  page_view: 'Page Views',
  job_view: 'Job Views',
  application_start: 'Applications Started',
  application_submit: 'Applications Submitted',
};

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          {Object.entries(COLORS).map(([key, color]) => (
            <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
          formatter={(value, name) => {
            const numValue = typeof value === 'number' ? value : 0;
            const strName = String(name);
            return [numValue, LABELS[strName as keyof typeof LABELS] || strName];
          }}
        />
        <Legend
          formatter={(value: string) => LABELS[value as keyof typeof LABELS] || value}
          wrapperStyle={{ paddingTop: 20 }}
        />
        <Area
          type="monotone"
          dataKey="page_view"
          stroke={COLORS.page_view}
          fill={`url(#gradient-page_view)`}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="job_view"
          stroke={COLORS.job_view}
          fill={`url(#gradient-job_view)`}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="application_start"
          stroke={COLORS.application_start}
          fill={`url(#gradient-application_start)`}
          strokeWidth={2}
        />
        <Area
          type="monotone"
          dataKey="application_submit"
          stroke={COLORS.application_submit}
          fill={`url(#gradient-application_submit)`}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
