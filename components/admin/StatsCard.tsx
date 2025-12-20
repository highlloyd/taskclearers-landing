import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
}

export default function StatsCard({ title, value, change, changeType = 'neutral', icon: Icon }: StatsCardProps) {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeColors[changeType]}`}>{change}</p>
          )}
        </div>
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-green-600" />
        </div>
      </div>
    </div>
  );
}
