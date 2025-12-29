import { useCallback } from 'react';
import { useAppStore } from '@/stores/useAppStore';

interface AppliedFiltersProps {
  onRemove?: (key: string) => void;
}

/**
 * 已应用筛选标签组件
 *
 * 功能：
 * 1. 显示所有已应用的筛选
 * 2. 单个移除按钮
 * 3. XSS防护（textContent自动转义）
 *
 * 内存泄漏防护：
 * - useCallback缓存事件处理函数
 */
export function AppliedFilters({ onRemove }: AppliedFiltersProps) {
  const appliedFilters = useAppStore((state) => state.filters.applied);
  const clearFilters = useAppStore((state) => state.clearFilters);

  // 维度标签映射（临时方案，后续从配置文件读取）
  const dimensionLabels: Record<string, string> = {
    third_level_organization: '三级机构',
    start_month: '起保月',
    customer_category: '客户类别',
    energy_type: '能源类型',
    coverage_type: '险别组合',
    is_transferred_vehicle: '是否过户车',
    renewal_status: '续保状态',
    insurance_type: '险种',
    terminal_source: '终端来源',
  };

  // 维度颜色映射（临时方案，后续从配置文件读取）
  const dimensionColors: Record<string, string> = {
    third_level_organization: '#0070c0',
    start_month: '#00b050',
    customer_category: '#ff0000',
    energy_type: '#ffc000',
    coverage_type: '#7030a0',
    is_transferred_vehicle: '#008080',
    renewal_status: '#00b0f0',
    insurance_type: '#ff00ff',
    terminal_source: '#70ad47',
  };

  // ========== 移除单个筛选 ==========
  const handleRemove = useCallback(
    (key: string) => {
      clearFilters();
      onRemove?.(key);
    },
    [clearFilters, onRemove]
  );

  // ========== 清空所有筛选 ==========
  const handleClearAll = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  if (appliedFilters.length === 0) {
    return (
      <div className="applied-filters-empty" style={{ color: '#9ca3af', fontSize: '14px' }}>
        暂无筛选条件
      </div>
    );
  }

  return (
    <div className="applied-filters">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {appliedFilters.map((filter) => {
          const label = dimensionLabels[filter.key] || filter.key;
          const color = dimensionColors[filter.key] || '#999';

          return (
            <div
              key={filter.key}
              className="filter-tag"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#fff',
                border: `1px solid ${color}`,
                borderLeftWidth: '4px',
                borderLeftStyle: 'solid',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <span
                className="filter-tag-label"
                style={{ fontWeight: 500, color: '#374151' }}
              >
                {label}:
              </span>
              <span
                className="filter-tag-values"
                style={{ color: '#6b7280' }}
              >
                {filter.values.length > 3
                  ? `${filter.values.slice(0, 3).join(', ')}... (${filter.values.length})`
                  : filter.values.join(', ')}
              </span>
              <button
                className="filter-tag-remove"
                onClick={() => handleRemove(filter.key)}
                style={{
                  marginLeft: '4px',
                  padding: '2px 6px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: '16px',
                  lineHeight: 1,
                }}
                title="移除"
              >
                ×
              </button>
            </div>
          );
        })}

        {appliedFilters.length > 0 && (
          <button
            className="clear-all-filters"
            onClick={handleClearAll}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              color: '#ef4444',
              backgroundColor: 'transparent',
              border: '1px solid #ef4444',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            清空全部
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * 筛选操作按钮组件
 */
export function FilterActions() {
  const appliedCount = useAppStore((state) => state.filters.applied.length);
  const applyFilters = useAppStore((state) => state.applyFilters);
  const clearFilters = useAppStore((state) => state.clearFilters);
  const loading = useAppStore((state) => state.loading);

  return (
    <div className="filter-actions" style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
      <button
        className="btn btn-primary apply-filter-btn"
        onClick={applyFilters}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 500,
          backgroundColor: '#a02724',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? '应用中...' : '应用筛选'}
      </button>

      <button
        className="btn btn-secondary clear-filter-btn"
        onClick={clearFilters}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 500,
          backgroundColor: '#fff',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        清空
      </button>

      {appliedCount > 0 && (
        <span
          className="filter-count"
          style={{
            marginLeft: 'auto',
            fontSize: '14px',
            color: '#6b7280',
          }}
        >
          已应用 {appliedCount} 个筛选
        </span>
      )}
    </div>
  );
}
