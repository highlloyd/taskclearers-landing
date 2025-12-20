'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface SourceData {
  source: string;
  count: number;
}

interface SourceBreakdownProps {
  data: SourceData[];
}

const COLORS = [
  '#10b981', // emerald
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#64748b', // slate
];

// Format source name for display
function formatSourceName(source: string): string {
  if (source === 'direct') return 'Direct';
  // Capitalize first letter
  return source.charAt(0).toUpperCase() + source.slice(1);
}

export default function SourceBreakdown({ data }: SourceBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No source data available</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);

  const formattedData = data.map((d, index) => ({
    ...d,
    name: formatSourceName(d.source),
    color: COLORS[index % COLORS.length],
    percentage: ((d.count / total) * 100).toFixed(1),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={formattedData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="count"
              nameKey="name"
            >
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const numValue = typeof value === 'number' ? value : 0;
                const strName = String(name);
                return [
                  `${numValue.toLocaleString()} (${formattedData.find((d) => d.name === strName)?.percentage}%)`,
                  strName,
                ];
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Table breakdown */}
      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Events
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {formattedData.map((source, index) => (
              <tr key={source.source} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="text-sm text-gray-900">{source.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-900">
                  {source.count.toLocaleString()}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-500">
                  {source.percentage}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                Total
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                {total.toLocaleString()}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-right text-sm text-gray-500">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
