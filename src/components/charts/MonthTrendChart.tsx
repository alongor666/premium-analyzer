import { useMemo } from 'react';
import { EChartsWrapper } from './EChartsWrapper';
import type { EChartsOption } from 'echarts';
import type { AggregatedData } from '@/types/data';

export interface MonthTrendChartProps {
  data: AggregatedData[];
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 月度保费趋势图
 *
 * 核心功能：
 * 1. 折线图展示保费月度趋势
 * 2. 数据标记点和标签
 * 3. 渐变面积填充
 * 4. Tooltip交互
 *
 * 数据格式：
 * - X轴: dimension (月份，如 "2025-01", "2025-02", ...)
 * - Y轴: premium (保费收入)
 */
export function MonthTrendChart({ data, loading = false, className = '', style }: MonthTrendChartProps) {
  // ========== 准备图表数据 ==========
  const chartOption = useMemo<EChartsOption>(() => {
    // 提取月份和保费数据
    const months = data.map((item) => item.dimension);
    const premiums = data.map((item) => item.premium);

    return {
      title: {
        text: '月度保费趋势',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 600,
          color: '#2c2c2c',
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const param = params[0];
          const value = param.value as number;
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${param.axisValue}</div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${param.color}; border-radius: 50%;"></span>
                <span>保费收入: </span>
                <span style="font-weight: 600; color: #a02724;">${value.toFixed(2)} 万元</span>
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
        data: months,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb',
          },
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 12,
          rotate: months.length > 12 ? 45 : 0,
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
          padding: [0, 0, 0, 0],
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
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          data: premiums,
          itemStyle: {
            color: '#a02724',
          },
          lineStyle: {
            width: 3,
            color: '#a02724',
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(160, 39, 36, 0.3)' },
                { offset: 1, color: 'rgba(160, 39, 36, 0.05)' },
              ],
            },
          },
          markPoint: {
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' },
            ],
            itemStyle: {
              color: '#a02724',
            },
            label: {
              color: '#2c2c2c',
              fontSize: 12,
            },
          },
          markLine: {
            data: [{ type: 'average', name: '平均值' }],
            lineStyle: {
              color: '#ffc000',
              type: 'dashed',
            },
            label: {
              color: '#2c2c2c',
              fontSize: 12,
            },
          },
        },
      ],
    };
  }, [data]);

  return (
    <EChartsWrapper
      option={chartOption}
      loading={loading}
      className={className}
      style={style}
    />
  );
}
