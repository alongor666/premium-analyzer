/**
 * 数据行类型定义
 */
export interface DataRow {
  [key: string]: string | number;
  third_level_organization: string;
  start_month: string;
  customer_category: string;
  energy_type: string;
  coverage_type: string;
  is_transferred_vehicle: string;
  renewal_status: string;
  insurance_type: string;
  terminal_source: string;
  premium: number;
}

/**
 * 聚合数据类型
 */
export interface AggregatedData {
  dimension: string;
  premium: number;
  ratio: number;
  count: number;
  avgPremium: number;
}

/**
 * 全局统计信息
 */
export interface GlobalStats {
  totalPremium: number;
  totalCount: number;
  totalRows: number;
  monthRange: string[];
}

/**
 * 文件解析结果
 */
export interface ParseResult {
  total: number;
  premium: number;
  dimensions: Record<string, string[]>;
  monthRange: string[];
  fields: string[];
  rows: DataRow[];
  globalStats: GlobalStats;
}

/**
 * 筛选结果
 */
export interface FilterResult {
  aggregated: AggregatedData[];
  summary: {
    filteredPremium: number;
    filteredCount: number;
    ratio: number;
  };
  filterCount: number;
}
