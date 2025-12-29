import { MetricCard } from './MetricCard';
import { useMetrics } from '@/hooks/useMetrics';

/**
 * 指标网格容器组件
 *
 * 渲染4个核心指标卡片
 * 使用useMetrics hook获取数据
 */
export function MetricsGrid() {
  const { metrics } = useMetrics();

  if (metrics.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
}

/**
 * 单个指标Hook (可选)
 * 用于单独获取某个指标数据
 */
export function useMetricCard(index: number) {
  const { metrics } = useMetrics();
  return metrics[index] || null;
}
