/**
 * 已应用的筛选器
 */
export interface AppliedFilter {
  key: string;
  values: string[];
}

/**
 * 筛选状态（draft → applied模式）
 */
export interface FilterState {
  draft: Record<string, string[]>;
  applied: AppliedFilter[];
}

/**
 * 标签页类型
 */
export type Tab = 'overview' | 'barChart' | 'ratioChart' | 'detail';

/**
 * 维度配置类型
 */
export interface DimensionConfig {
  key: string;
  label: string;
  csvFields: string[];
  color: string;
  group: number;
  sortable: boolean;
  searchable: boolean;
  type?: 'time' | 'string';
  format?: string;
}

/**
 * 指标配置类型
 */
export interface MetricConfig {
  key: string;
  label: string;
  csvFields: string[];
  unit: string;
  format: string;
  aggregation: 'sum' | 'avg' | 'count';
}
