import { useMemo } from 'react';
import { EChartsWrapper } from './EChartsWrapper';
import type { EChartsOption } from 'echarts';
import type { AggregatedData } from '@/types/data';

export interface BarChartProps {
  data: AggregatedData[];
  dimensionLabel?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onDataClick?: (dimension: string) => void;
}

/**
 * 维度保费对比柱状图
 *
 * 核心功能：
 * 1. 柱状图展示各维度保费对比
 * 2. 数据排序（默认按保费降序）
 * 3. 滚动支持（大量数据时）
 * 4. 点击事件支持
 *
 * 数据格式：
 * - X轴: dimension (维度值，如机构名称)
 * - Y轴: premium (保费收入)
 */
export function BarChart({
  data,
  dimensionLabel = '维度',
  loading = false,
  className = '',
  style,
  onDataClick,
}: BarChartProps) {
  // ========== 准备图表数据 ==========
  const chartOption = useMemo<EChartsOption>(() => {
    // 按保费降序排序
    const sortedData = [...data].sort((a, b) => b.premium - a.premium);

    const dimensions = sortedData.map((item) => item.dimension);
    const premiums = sortedData.map((item) => item.premium);

    return {
      title: {
        text: `${dimensionLabel}保费对比`,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 600,
          color: '#2c2c2c',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const param = params[0];
          const value = param.value as number;
          const dataIndex = param.dataIndex;
          const avgPremium = sortedData[dataIndex]?.avgPremium || 0;
          const count = sortedData[dataIndex]?.count || 0;

          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${param.axisValue}</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; border-radius: 2px;"></span>
                <span>总保费: </span>
                <span style="font-weight: 600; color: #a02724;">${value.toFixed(2)} 万元</span>
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                平均保费: ${avgPremium.toFixed(2)} 万元 | 业务量: ${count} 笔
              </div>
            </div>
          `;
        },
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
          fontSize: 14,
        },
        extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dimensions,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          rotate: 45,
          interval: 0,
        },
        axisTick: {
          alignWithLabel: true,
        },
      },
      yAxis: {
        type: 'value',
        name: '保费（万元）',
        nameTextStyle: {
          color: '#6b7280',
          fontSize: 12,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 12,
          formatter: (value: number) => {
            if (value >= 10000) {
              return (value / 10000).toFixed(0) + '万';
            }
            return value.toFixed(0);
          },
        },
        splitLine: {
          lineStyle: {
            color: '#e5e7eb',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: '保费收入',
          type: 'bar',
          data: premiums,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#a02724' },
                { offset: 1, color: '#c7423f' },
              ],
            },
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: '#8a211e',
            },
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              const value = params.value as number;
              if (value >= 10000) {
                return (value / 10000).toFixed(1) + '万';
              }
              return value.toFixed(0);
            },
            color: '#2c2c2c',
            fontSize: 11,
          },
          barMaxWidth: 50,
        },
      ],
      dataZoom: dimensions.length > 20 ? [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 50,
          height: 20,
          bottom: 10,
          borderColor: '#e5e7eb',
          fillerColor: 'rgba(160, 39, 36, 0.2)',
          handleStyle: {
            color: '#a02724',
          },
          textStyle: {
            color: '#6b7280',
            fontSize: 11,
          },
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 50,
        },
      ] : undefined,
    };
  }, [data, dimensionLabel]);

  // ========== 点击事件处理 ==========
  const handleChartClick = (params: any) => {
    if (onDataClick && params.componentType === 'series') {
      const dataIndex = params.dataIndex;
      const sortedData = [...data].sort((a, b) => b.premium - a.premium);
      const clickedDimension = sortedData[dataIndex]?.dimension;
      if (clickedDimension) {
        onDataClick(clickedDimension);
      }
    }
  };

  return (
    <EChartsWrapper
      option={chartOption}
      loading={loading}
      className={className}
      style={style}
      onEvents={onDataClick ? { click: handleChartClick } : undefined}
    />
  );
}
