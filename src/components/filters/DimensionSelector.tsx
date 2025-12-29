import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useDimensionFilter } from '@/hooks/useFilters';
import type { DimensionConfig } from '@/types/filters';

interface DimensionSelectorProps {
  dimension: DimensionConfig;
  allValues: string[];
}

/**
 * 维度筛选器组件
 *
 * 核心功能：
 * 1. Draft筛选状态管理（本地state）
 * 2. 下拉框展开/收起
 * 3. 全选/反选/清空操作
 * 4. 点击外部自动关闭
 *
 * 内存泄漏防护：
 * - useEffect cleanup移除document点击监听
 * - useRef存储下拉框状态
 */
export function DimensionSelector({ dimension, allValues }: DimensionSelectorProps) {
  const {
    selectedValues,
    selectedCount,
    totalCount,
    isAllSelected,
    update,
    selectAll,
    invert,
    clear,
  } = useDimensionFilter(dimension.key);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ========== 点击外部关闭下拉框 ==========
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isDropdownOpen &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  // ========== 切换下拉框 ==========
  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  // ========== 处理选项选择 ==========
  const handleOptionChange = useCallback(
    (value: string, checked: boolean) => {
      let newSelectedValues: string[];

      if (checked) {
        // 添加选项
        newSelectedValues = [...selectedValues, value];
      } else {
        // 移除选项
        newSelectedValues = selectedValues.filter((v) => v !== value);
      }

      update(newSelectedValues);
    },
    [selectedValues, update]
  );

  // ========== 处理全选 ==========
  const handleSelectAll = useCallback(() => {
    selectAll();
  }, [selectAll]);

  // ========== 处理反选 ==========
  const handleInvert = useCallback(() => {
    invert();
  }, [invert]);

  // ========== 关闭下拉框 ==========
  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  return (
    <div ref={containerRef} className="dimension-item" data-key={dimension.key}>
      {/* 维度头部 */}
      <div
        className="dimension-header"
        style={{
          borderLeftColor: dimension.color,
          borderLeftWidth: '4px',
          borderLeftStyle: 'solid',
          paddingLeft: '12px',
          padding: '12px',
          cursor: 'pointer',
          backgroundColor: '#fff',
          transition: 'background-color 0.2s',
        }}
        onClick={toggleDropdown}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#fff';
        }}
      >
        <span className="dimension-label" style={{ fontWeight: 500, color: '#374151' }}>
          {dimension.label}
        </span>

        {selectedCount > 0 && (
          <span
            className="selected-count"
            style={{
              marginLeft: '8px',
              padding: '2px 8px',
              backgroundColor: dimension.color,
              color: '#fff',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            {selectedCount}
          </span>
        )}

        <span
          className="dropdown-icon"
          style={{
            marginLeft: 'auto',
            transition: 'transform 0.2s',
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </span>
      </div>

      {/* 下拉框 */}
      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="dimension-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            marginTop: '4px',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 下拉框头部 */}
          <div
            className="dropdown-header"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span className="dropdown-title" style={{ fontWeight: 600, fontSize: '14px' }}>
              {dimension.label}
            </span>
            <div className="dropdown-actions" style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-xs btn-invert"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInvert();
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                反选
              </button>
              <button
                className="btn-close-dropdown"
                onClick={(e) => {
                  e.stopPropagation();
                  closeDropdown();
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280',
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* 选项区域 */}
          <div
            className="dropdown-options"
            style={{
              padding: '8px 0',
              overflowY: 'auto',
              maxHeight: '320px',
            }}
          >
            {/* 全选选项 */}
            <label
              className="option-item select-all"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
              }}
            >
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleSelectAll();
                  } else {
                    clear();
                  }
                }}
                style={{ marginRight: '12px' }}
              />
              <span style={{ fontSize: '14px', color: '#374151' }}>
                全选 ({totalCount})
              </span>
            </label>

            {/* 选项列表 */}
            <div className="options-list">
              {allValues.map((value) => (
                <label
                  key={value}
                  className="option-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <input
                    type="checkbox"
                    value={value}
                    checked={selectedValues.includes(value)}
                    onChange={(e) => handleOptionChange(value, e.target.checked)}
                    style={{ marginRight: '12px' }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>{value}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Memo优化后的DimensionSelector
 * 避免allValues变化导致不必要的重渲染
 */
export const MemoizedDimensionSelector = memo(DimensionSelector, (prev, next) => {
  return (
    prev.dimension.key === next.dimension.key &&
    prev.allValues.length === next.allValues.length &&
    prev.allValues.every((v, i) => v === next.allValues[i])
  );
});
