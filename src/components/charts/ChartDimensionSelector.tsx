import { useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export interface ChartDimensionSelectorProps {
  currentDimension: string;
  onDimensionChange: (dimension: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 图表维度选择器
 *
 * 核心功能：
 * 1. 下拉选择维度
 * 2. 显示当前选中的维度
 * 3. 样式统一McKinsey风格
 *
 * 使用场景：
 * - 柱状图维度切换
 * - 占比图维度切换
 * - 表格维度切换
 */
export function ChartDimensionSelector({
  currentDimension,
  onDimensionChange,
  className = '',
  style,
}: ChartDimensionSelectorProps) {
  const dimensions = useAppStore((state) => state.dimensions);

  // ========== 维度标签映射 ==========
  const dimensionLabels: Record<string, string> = useMemo(
    () => ({
      third_level_organization: '三级机构',
      start_month: '起保月',
      customer_category: '客户类别',
      energy_type: '能源类型',
      coverage_type: '险别组合',
      is_transferred_vehicle: '是否过户车',
      renewal_status: '续保状态',
      insurance_type: '险种',
      terminal_source: '终端来源',
    }),
    []
  );

  // ========== 可用维度列表 ==========
  const availableDimensions = useMemo(() => {
    return Object.keys(dimensions).filter((key) => dimensions[key]?.length > 0);
  }, [dimensions]);

  return (
    <div
      className={`chart-dimension-selector ${className}`}
      style={{ display: 'flex', alignItems: 'center', gap: '12px', ...style }}
    >
      <label
        htmlFor="chart-dimension-select"
        style={{
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151',
        }}
      >
        分组维度：
      </label>
      <select
        id="chart-dimension-select"
        value={currentDimension}
        onChange={(e) => onDimensionChange(e.target.value)}
        style={{
          padding: '8px 12px',
          fontSize: '14px',
          color: '#374151',
          backgroundColor: '#fff',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.2s',
          minWidth: '150px',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#a02724';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
      >
        {availableDimensions.map((key) => (
          <option key={key} value={key}>
            {dimensionLabels[key] || key}
          </option>
        ))}
      </select>

      {availableDimensions.length > 0 && (
        <span
          style={{
            fontSize: '12px',
            color: '#9ca3af',
          }}
        >
          （{availableDimensions.length} 个维度可选）
        </span>
      )}
    </div>
  );
}
