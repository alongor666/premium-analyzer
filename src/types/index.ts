// 导出所有类型定义
export * from './app';
export * from './data';
export * from './filters';
export * from './charts';
export * from './worker';

/**
 * 指标卡片Props
 */
export interface MetricCardProps {
  title: string;
  value: string;
  subtext: string;
  trend?: number;
  status?: 'primary' | 'info' | 'success' | 'warning' | 'default';
}
