import { useMemo } from 'react';
import { EChartsWrapper } from './EChartsWrapper';
import type { EChartsOption } from 'echarts';
import type { AggregatedData } from '@/types/data';

export interface RatioChartProps {
  data: AggregatedData[];
  dimensionLabel?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  chartType?: 'pie' | 'rose';
  onDataClick?: (dimension: string) => void;
}

/**
 * 维度保费占比图
 *
 * 核心功能：
 * 1. 饼图/南丁格尔玫瑰图展示保费占比
 * 2. 支持切换图表类型
 * 3. 点击事件支持
 * 4. 自定义颜色方案
 *
 * 数据格式：
 * - name: dimension (维度值)
 * - value: premium (保费收入)
 */
export function RatioChart({
  data,
  dimensionLabel = '维度',
  loading = false,
  className = '',
  style,
  chartType = 'pie',
  onDataClick,
}: RatioChartProps) {
  // ========== 颜色方案 ==========
  const colorPalette = [
    '#a02724', '#0070c0', '#00b050', '#ffc000', '#7030a0',
    '#ff0000', '#008080', '#00b0f0', '#ff00ff', '#70ad47',
    '#5b9bd5', '#ed7d31', '#a5a5a5', '#ffc000', '#4472c4',
    '#70ad47', '#255e91', '#9e480e', '#636363', '#987654'
  ];

  // ========== 准备图表数据 ==========
  const chartOption = useMemo<EChartsOption>(() => {
    // 按保费降序排序
    const sortedData = [...data].sort((a, b) => b.premium - a.premium);

    // 转换为饼图数据格式
    const chartData = sortedData.map((item) => ({
      name: item.dimension,
      value: item.premium,
      count: item.count,
      avgPremium: item.avgPremium,
    }));

    return {
      title: {
        text: `${dimensionLabel}保费占比`,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 600,
          color: '#2c2c2c',
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data as any;
          return `
            <div style="padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${data.name}</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${params.color}; border-radius: 50%;"></span>
                <span>保费: </span>
                <span style="font-weight: 600; color: #a02724;">${data.value.toFixed(2)} 万元</span>
              </div>
              <div style="font-size: 12px; color: #6b7280;">
                占比: ${params.percent}% | 平均保费: ${data.avgPremium.toFixed(2)} 万元 | 业务量: ${data.count} 笔
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
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: {
          color: '#6b7280',
          fontSize: 12,
        },
        itemGap: 12,
        itemWidth: 16,
        itemHeight: 12,
      },
      series: [
        {
          name: '保费收入',
          type: 'pie' as const,
          radius: chartType === 'rose' ? ['20%', '70%'] : ['40%', '70%'],
          center: ['40%', '50%'],
          roseType: chartType === 'rose' ? ('area' as const) : undefined,
          data: chartData,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: (params: any) => {
              const percent = params.percent;
              if (percent < 5) return ''; // 占比小于5%不显示标签
              return `${params.name}\n${percent.toFixed(1)}%`;
            },
            color: '#2c2c2c',
            fontSize: 11,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 600,
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
            },
          },
          labelLine: {
            lineStyle: {
              color: '#e5e7eb',
            },
            smooth: 0.2,
            length: 10,
            length2: 20,
          },
        },
      ],
      color: colorPalette,
    };
  }, [data, dimensionLabel, chartType]);

  // ========== 点击事件处理 ==========
  const handleChartClick = (params: any) => {
    if (onDataClick && params.componentType === 'series') {
      const clickedDimension = params.data?.name;
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
