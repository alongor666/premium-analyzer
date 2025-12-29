import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption, ECharts } from 'echarts';

export interface ChartEvents {
  click?: (params: any) => void;
  legendselectchanged?: (params: any) => void;
  datazoom?: (params: any) => void;
  restores?: (params: any) => void;
}

export interface EChartsWrapperProps {
  option: EChartsOption;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  theme?: string | object;
  onEvents?: ChartEvents;
  onChartReady?: (chart: ECharts) => void;
}

export interface EChartsWrapperRef {
  getChartInstance: () => ECharts | null;
  resize: () => void;
  refresh: () => void;
}

/**
 * ECharts包装器组件
 *
 * 核心功能：
 * 1. ECharts实例管理（初始化、更新、销毁）
 * 2. 响应式resize
 * 3. 事件绑定与清理
 * 4. Loading状态管理
 *
 * 内存泄漏防护：
 * - useEffect cleanup: dispose实例
 * - useEffect cleanup: 移除事件监听
 * - useEffect cleanup: 移除resize监听
 */
export const EChartsWrapper = forwardRef<EChartsWrapperRef, EChartsWrapperProps>(
  ({ option, className = '', style, loading = false, theme, onEvents, onChartReady }, ref) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstanceRef = useRef<ECharts | null>(null);

    // ========== 暴露图表实例方法 ==========
    useImperativeHandle(
      ref,
      () => ({
        getChartInstance: () => chartInstanceRef.current,
        resize: () => {
          chartInstanceRef.current?.resize();
        },
        refresh: () => {
          if (chartInstanceRef.current) {
            chartInstanceRef.current.setOption(option, true);
          }
        },
      }),
      [option]
    );

    // ========== 初始化图表实例 ==========
    useEffect(() => {
      if (!chartRef.current) return;

      // 初始化ECharts实例
      const chart = echarts.init(chartRef.current, theme);
      chartInstanceRef.current = chart;

      // 触发图表就绪回调
      onChartReady?.(chart);

      // 清理：dispose实例（防止内存泄漏）
      return () => {
        chart.dispose();
        chartInstanceRef.current = null;
      };
    }, [theme, onChartReady]);

    // ========== 更新图表配置 ==========
    useEffect(() => {
      if (!chartInstanceRef.current) return;

      // 使用notMerge=true完全替换配置
      chartInstanceRef.current.setOption(option, true);
    }, [option]);

    // ========== 事件绑定与清理 ==========
    useEffect(() => {
      if (!chartInstanceRef.current || !onEvents) return;

      const chart = chartInstanceRef.current;

      // 绑定所有事件
      Object.entries(onEvents).forEach(([eventName, handler]) => {
        if (handler) {
          chart.on(eventName, handler);
        }
      });

      // 清理：移除所有事件监听（防止内存泄漏）
      return () => {
        if (onEvents) {
          Object.keys(onEvents).forEach((eventName) => {
            chart.off(eventName);
          });
        }
      };
    }, [onEvents]);

    // ========== Loading状态管理 ==========
    useEffect(() => {
      if (!chartInstanceRef.current) return;

      if (loading) {
        chartInstanceRef.current.showLoading('default', {
          text: '加载中...',
          color: '#a02724',
          textColor: '#2c2c2c',
          maskColor: 'rgba(255, 255, 255, 0.8)',
          zlevel: 0,
        });
      } else {
        chartInstanceRef.current.hideLoading();
      }
    }, [loading]);

    // ========== 响应式resize ==========
    useEffect(() => {
      const handleResize = () => {
        chartInstanceRef.current?.resize();
      };

      window.addEventListener('resize', handleResize);

      // 清理：移除resize监听（防止内存泄漏）
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []);

    return (
      <div
        ref={chartRef}
        className={`echarts-wrapper ${className}`}
        style={{ width: '100%', height: '100%', minHeight: '300px', ...style }}
      />
    );
  }
);

EChartsWrapper.displayName = 'EChartsWrapper';
