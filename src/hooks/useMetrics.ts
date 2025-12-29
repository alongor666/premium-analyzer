import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';

/**
 * 指标数据接口
 */
export interface Metric {
  title: string;
  value: string;
  subtext: string;
  trend?: number;
  status: 'primary' | 'info' | 'success' | 'warning' | 'default';
}

/**
 * 指标计算Hook
 *
 * 职责：
 * 1. 计算核心指标（总保费、已筛选保费等）
 * 2. 格式化显示数值
 * 3. 计算趋势和占比
 * 4. 生成指标卡片数据
 */
export function useMetrics() {
  const globalStats = useAppStore((state) => state.globalStats);
  const aggregatedData = useAppStore((state) => state.aggregatedData);
  const appliedFilters = useAppStore((state) => state.filters.applied);

  /**
   * 格式化保费数值
   */
  const formatPremium = useMemo(
    () => (value: number): string => {
      if (value < 10000) {
        return value.toFixed(2);
      }
      return (value / 10000).toFixed(2) + '万';
    },
    []
  );

  /**
   * 格式化比率
   */
  const formatRatio = useMemo(
    () => (ratio: number): string => {
      return (ratio * 100).toFixed(2) + '%';
    },
    []
  );

  /**
   * 计算指标卡片数据
   */
  const metrics = useMemo((): Metric[] => {
    if (!globalStats) {
      return [];
    }

    const totalPremium = globalStats.totalPremium || 0;
    const totalCount = globalStats.totalCount || 0;

    // 计算已筛选保费
    let filteredPremium = totalPremium;
    let filteredRatio = 1;

    if (aggregatedData && aggregatedData.length > 0) {
      filteredPremium = aggregatedData.reduce((sum, item) => sum + item.premium, 0);
      filteredRatio = totalPremium > 0 ? filteredPremium / totalPremium : 1;
    }

    // 计算平均保费
    const avgPremium = totalCount > 0 ? totalPremium / totalCount : 0;

    return [
      {
        title: '总保费收入',
        value: formatPremium(totalPremium),
        subtext: `共 ${totalCount} 条记录`,
        status: 'primary',
      },
      {
        title: '已筛选保费',
        value: formatPremium(filteredPremium),
        subtext: `占比 ${formatRatio(filteredRatio)}`,
        status: appliedFilters.length > 0 ? 'info' : 'default',
      },
      {
        title: '覆盖月份',
        value: String(globalStats.monthRange?.length || 0),
        subtext: globalStats.monthRange?.join(', ') || '暂无数据',
        status: 'success',
      },
      {
        title: '平均单均保费',
        value: formatPremium(avgPremium),
        subtext: '单条记录平均值',
        status: 'default',
      },
    ];
  }, [globalStats, aggregatedData, appliedFilters.length, formatPremium, formatRatio]);

  /**
   * 计算趋势数据（与前一筛选条件对比）
   */
  const trend = useMemo(() => {
    if (!aggregatedData || aggregatedData.length === 0) {
      return null;
    }

    // 这里可以添加趋势计算逻辑
    // 例如：与上次筛选结果对比
    return null;
  }, [aggregatedData]);

  return {
    metrics,
    formatPremium,
    formatRatio,
    trend,
  };
}

/**
 * 单个指标Hook
 */
export function useMetric(index: number) {
  const { metrics } = useMetrics();

  return metrics[index] || null;
}
