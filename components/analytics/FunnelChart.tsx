'use client';

import { FUNNEL_STAGES } from '@/lib/analytics';

interface FunnelData {
  eventType: string;
  count: number;
}

interface FunnelChartProps {
  data: FunnelData[];
}

const COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-emerald-500',
];

export default function FunnelChart({ data }: FunnelChartProps) {
  // Create a map for quick lookup
  const dataMap = new Map(data.map((d) => [d.eventType, d.count]));

  // Get counts for each stage
  const stages = FUNNEL_STAGES.map((stage, index) => ({
    ...stage,
    count: dataMap.get(stage.key) || 0,
    color: COLORS[index],
  }));

  // Calculate max for scaling
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  // Calculate conversion rates
  const getConversionRate = (index: number): string => {
    if (index === 0) return '100%';
    const current = stages[index].count;
    const previous = stages[index - 1].count;
    if (previous === 0) return '0%';
    return `${((current / previous) * 100).toFixed(1)}%`;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No funnel data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {stages.map((stage, index) => {
        const widthPercent = (stage.count / maxCount) * 100;
        return (
          <div key={stage.key} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{stage.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{getConversionRate(index)}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {stage.count.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
              <div
                className={`h-8 rounded-full ${stage.color} transition-all duration-500 flex items-center justify-end pr-3`}
                style={{ width: `${Math.max(widthPercent, 2)}%` }}
              >
                {widthPercent > 15 && (
                  <span className="text-xs font-medium text-white">
                    {stage.count.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            {index < stages.length - 1 && (
              <div className="flex justify-center my-1">
                <svg
                  className="w-4 h-4 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            )}
          </div>
        );
      })}

      {/* Overall conversion rate */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Overall Conversion</span>
          <span className="text-lg font-bold text-emerald-600">
            {stages[0].count > 0
              ? `${((stages[3].count / stages[0].count) * 100).toFixed(2)}%`
              : '0%'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          From page view to application submitted
        </p>
      </div>
    </div>
  );
}
