import type { EChartsOption } from 'echarts';

/**
 * 图表类型
 */
export type ChartType = 'line' | 'bar' | 'pie';

/**
 * 图表配置选项
 */
export interface ChartOptions {
  roseType?: 'area' | 'radius';
  maxItems?: number;
  showOthers?: boolean;
}

/**
 * ECharts包装器Props
 */
export interface EChartsWrapperProps {
  option: EChartsOption;
  className?: string;
  onEvents?: Record<string, (params: any) => void>;
}

/**
 * 图表维度选择器Props
 */
export interface ChartDimensionSelectorProps {
  dimensions: any[];
  currentDimension: string;
  onDimensionChange: (dimension: string) => void;
  syncMode?: boolean;
}
