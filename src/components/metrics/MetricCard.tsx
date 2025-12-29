import { memo } from 'react';
import { Card } from '@/components/ui';
import type { MetricCardProps } from '@/types';

/**
 * 指标卡片组件
 *
 * 使用React.memo优化性能，避免不必要的重渲染
 */
export const MetricCard = memo<MetricCardProps>(({ title, value, subtext, trend, status = 'default' }) => {
  const statusStyles = {
    primary: 'border-l-4 border-l-[#a02724]',
    info: 'border-l-4 border-l-blue-500',
    success: 'border-l-4 border-l-green-500',
    warning: 'border-l-4 border-l-yellow-500',
    default: 'border-l-4 border-l-gray-300',
  };

  const trendElement = trend !== undefined ? (
    <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'}`}>
      {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} {Math.abs(trend)}%
    </div>
  ) : null;

  return (
    <Card className={`${statusStyles[status]} hover:shadow-md transition-shadow`}>
      <div className="text-sm font-medium text-gray-600 mb-2">{title}</div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      {subtext && <div className="text-sm text-gray-500 mb-2">{subtext}</div>}
      {trendElement}
    </Card>
  );
});

MetricCard.displayName = 'MetricCard';
