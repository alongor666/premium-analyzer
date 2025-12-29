import { useMemo } from 'react';
import type { AggregatedData } from '@/types/data';

export interface DataTableProps {
  data: AggregatedData[];
  dimensionLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  onRowClick?: (dimension: string) => void;
}

/**
 * 数据表格组件
 *
 * 核心功能：
 * 1. 表格展示聚合数据
 * 2. 固定表头
 * 3. 排序功能（默认按保费降序）
 * 4. 点击行事件
 *
 * 数据格式：
 * - dimension: 维度值
 * - premium: 保费收入
 * - ratio: 占比
 * - count: 业务量
 * - avgPremium: 平均保费
 *
 * XSS防护：
 * - 所有文本使用textContent渲染（自动转义）
 */
export function DataTable({
  data,
  dimensionLabel = '维度',
  className = '',
  style,
  onRowClick,
}: DataTableProps) {
  // ========== 排序数据 ==========
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.premium - a.premium);
  }, [data]);

  // ========== 格式化数字 ==========
  const formatPremium = (value: number) => {
    if (value >= 10000) {
      return (value / 10000).toFixed(2) + '万';
    }
    return value.toFixed(2);
  };

  const formatRatio = (value: number) => {
    return value.toFixed(2) + '%';
  };

  const formatAvgPremium = (value: number) => {
    return value.toFixed(2);
  };

  const formatCount = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <div className={`data-table-wrapper ${className}`} style={style}>
      <table
        className="data-table"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* 表头 */}
        <thead>
          <tr
            style={{
              backgroundColor: '#f9fafb',
              borderBottom: '2px solid #e5e7eb',
            }}
          >
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {dimensionLabel}
            </th>
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              保费收入（万元）
            </th>
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              占比
            </th>
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              平均保费（万元）
            </th>
            <th
              style={{
                padding: '12px 16px',
                textAlign: 'right',
                fontSize: '13px',
                fontWeight: 600,
                color: '#374151',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              业务量（笔）
            </th>
          </tr>
        </thead>

        {/* 表体 */}
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={row.dimension}
              style={{
                borderBottom: '1px solid #f3f4f6',
                backgroundColor: onRowClick ? 'inherit' : '#fff',
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                }
              }}
              onMouseLeave={(e) => {
                if (onRowClick) {
                  e.currentTarget.style.backgroundColor = '#fff';
                }
              }}
              onClick={() => onRowClick?.(row.dimension)}
            >
              <td
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#374151',
                  fontWeight: index < 3 ? 500 : 400,
                }}
              >
                {/* 前三名加粗显示 */}
                {index < 3 && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: '20px',
                      height: '20px',
                      lineHeight: '20px',
                      textAlign: 'center',
                      borderRadius: '50%',
                      backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                      marginRight: '8px',
                    }}
                  >
                    {index + 1}
                  </span>
                )}
                {row.dimension}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: index < 3 ? '#a02724' : '#374151',
                  fontWeight: index < 3 ? 600 : 400,
                  textAlign: 'right',
                }}
              >
                {formatPremium(row.premium)}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#6b7280',
                  textAlign: 'right',
                }}
              >
                {formatRatio(row.ratio)}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#6b7280',
                  textAlign: 'right',
                }}
              >
                {formatAvgPremium(row.avgPremium)}
              </td>
              <td
                style={{
                  padding: '12px 16px',
                  fontSize: '14px',
                  color: '#6b7280',
                  textAlign: 'right',
                }}
              >
                {formatCount(row.count)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 空状态 */}
      {sortedData.length === 0 && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '14px',
          }}
        >
          暂无数据
        </div>
      )}
    </div>
  );
}
