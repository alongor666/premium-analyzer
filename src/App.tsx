import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { useMetrics } from '@/hooks/useMetrics';
import { FileUploader } from '@/components/upload';
import { MemoizedDimensionSelector, AppliedFilters, FilterActions } from '@/components/filters';
import { MetricsGrid } from '@/components/metrics';
import { MonthTrendChart, BarChart, RatioChart, ChartDimensionSelector } from '@/components/charts';
import { DataTable } from '@/components/tables';
import { Loading, ProgressBar } from '@/components/ui';
import type { ParseResult } from '@/types';

/**
 * Premium Analyzer - React版本主应用
 *
 * 功能：
 * 1. 文件上传与解析
 * 2. 多维度筛选
 * 3. 指标卡片展示
 * 4. 图表可视化（趋势图、柱状图、占比图）
 * 5. 数据表格
 *
 * 架构：
 * - Zustand状态管理
 * - Web Worker数据处理
 * - React组件化
 * - 内存泄漏防护
 */
function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'barChart' | 'ratioChart' | 'detail'>('overview');
  const [chartDimension, setChartDimension] = useState('third_level_organization');
  const [showUpload, setShowUpload] = useState(true);

  // ========== Store & Hooks ==========
  const {
    rawData,
    globalStats,
    aggregatedData,
    dimensions,
    loading,
    error,
    setData,
    applyFilters,
    setCurrentGroupBy,
  } = useAppStore();

  const { formatPremium } = useMetrics();

  // ========== 维度配置 ==========
  const dimensionConfigs = useMemo(
    () => [
      {
        key: 'third_level_organization',
        label: '三级机构',
        color: '#0070c0',
        csvFields: ['三级机构', '机构名称'],
        group: 1,
        sortable: true,
        searchable: true,
      },
      {
        key: 'start_month',
        label: '起保月',
        color: '#00b050',
        csvFields: ['起保月', '月份'],
        group: 1,
        sortable: true,
        searchable: true,
      },
      {
        key: 'customer_category',
        label: '客户类别',
        color: '#ff0000',
        csvFields: ['客户类别', '客户类型'],
        group: 1,
        sortable: true,
        searchable: true,
      },
      {
        key: 'energy_type',
        label: '能源类型',
        color: '#ffc000',
        csvFields: ['能源类型'],
        group: 1,
        sortable: true,
        searchable: true,
      },
      {
        key: 'coverage_type',
        label: '险别组合',
        color: '#7030a0',
        csvFields: ['险别组合'],
        group: 1,
        sortable: true,
        searchable: true,
      },
      {
        key: 'is_transferred_vehicle',
        label: '是否过户车',
        color: '#008080',
        csvFields: ['是否过户车'],
        group: 1,
        sortable: true,
        searchable: true,
      },
      {
        key: 'renewal_status',
        label: '续保状态',
        color: '#00b0f0',
        csvFields: ['续保状态'],
        group: 1,
        sortable: true,
        searchable: true,
      },
      {
        key: 'insurance_type',
        label: '险种',
        color: '#ff00ff',
        csvFields: ['险种'],
        group: 1,
        sortable: true,
        searchable: true,
      },
      {
        key: 'terminal_source',
        label: '终端来源',
        color: '#70ad47',
        csvFields: ['终端来源'],
        group: 1,
        sortable: true,
        searchable: true,
      },
    ],
    []
  );

  // ========== 文件加载处理 ==========
  const handleFileLoaded = useCallback(
    async (result: ParseResult) => {
      try {
        setData(result.rows, result.globalStats, result.dimensions);
        setShowUpload(false);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    },
    [setData]
  );

  // ========== 筛选移除处理 ==========
  const handleRemoveFilter = useCallback(
    async () => {
      // clearFilters已调用，触发重新筛选
      await applyFilters();
    },
    [applyFilters]
  );

  // ========== 图表维度切换 ==========
  const handleChartDimensionChange = useCallback(
    (dimension: string) => {
      setChartDimension(dimension);
      setCurrentGroupBy(dimension);
    },
    [setCurrentGroupBy]
  );

  // ========== 数据加载中状态 ==========
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '20px',
          backgroundColor: '#f9fafb',
        }}
      >
        <Loading text="正在处理数据..." />
        <ProgressBar progress={0} stage="处理中" />
      </div>
    );
  }

  // ========== 错误状态 ==========
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
        }}
      >
        <div
          style={{
            padding: '24px',
            backgroundColor: '#fff',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            maxWidth: '500px',
          }}
        >
          <h2 style={{ color: '#dc2626', marginBottom: '12px' }}>错误</h2>
          <p style={{ color: '#374151' }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#a02724',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // ========== 文件上传界面 ==========
  if (showUpload || !rawData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#f9fafb',
          padding: '40px 20px',
        }}
      >
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: '40px',
            }}
          >
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#2c2c2c',
                marginBottom: '12px',
              }}
            >
              保费收入多维度分析系统
            </h1>
            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
              }}
            >
              React版本 - 上传Excel或CSV文件开始分析
            </p>
          </div>

          <FileUploader onFileLoaded={handleFileLoaded} />

          <div
            style={{
              marginTop: '40px',
              padding: '20px',
              backgroundColor: '#fff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#374151', marginBottom: '12px' }}>
              使用说明
            </h3>
            <ul style={{ fontSize: '14px', color: '#6b7280', paddingLeft: '20px', lineHeight: '1.6' }}>
              <li>支持Excel (.xlsx, .xls) 和 CSV 格式</li>
              <li>文件大小不超过 10MB</li>
              <li>数据应包含以下字段：三级机构、起保月、客户类别、保费收入等</li>
              <li>上传后可进行多维度筛选和数据分析</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ========== 主界面 ==========
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
      }}
    >
      {/* 头部 */}
      <header
        style={{
          backgroundColor: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#2c2c2c',
              margin: 0,
            }}
          >
            保费收入多维度分析系统
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: '#6b7280',
              margin: '4px 0 0 0',
            }}
          >
            数据量: {globalStats?.totalRows || 0} 行 | 总保费: {globalStats ? formatPremium(globalStats.totalPremium) : '-'} 万元
          </p>
        </div>
      </header>

      {/* 主内容 */}
      <main
        style={{
          padding: '24px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* 筛选区域 */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#2c2c2c',
              marginBottom: '16px',
            }}
          >
            维度筛选
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            {dimensionConfigs.map((config) => (
              <MemoizedDimensionSelector
                key={config.key}
                dimension={config}
                allValues={dimensions[config.key] || []}
              />
            ))}
          </div>

          <AppliedFilters onRemove={handleRemoveFilter} />
          <FilterActions />
        </div>

        {/* 指标卡片 */}
        <MetricsGrid />

        {/* 标签页导航 */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '8px',
            padding: '20px',
            marginTop: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '20px',
            }}
          >
            {[
              { key: 'overview' as const, label: '概览' },
              { key: 'barChart' as const, label: '柱状图' },
              { key: 'ratioChart' as const, label: '占比图' },
              { key: 'detail' as const, label: '明细表' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: activeTab === tab.key ? '#a02724' : '#6b7280',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.key ? '2px solid #a02724' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.color = '#a02724';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.key) {
                    e.currentTarget.style.color = '#6b7280';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 图表维度选择器 */}
          {(activeTab === 'barChart' || activeTab === 'ratioChart' || activeTab === 'detail') && (
            <ChartDimensionSelector
              currentDimension={chartDimension}
              onDimensionChange={handleChartDimensionChange}
              style={{ marginBottom: '20px' }}
            />
          )}

          {/* 内容区域 */}
          <div style={{ minHeight: '400px' }}>
            {activeTab === 'overview' && aggregatedData && (
              <MonthTrendChart data={aggregatedData} />
            )}

            {activeTab === 'barChart' && aggregatedData && (
              <BarChart data={aggregatedData} dimensionLabel={dimensionConfigs.find((d) => d.key === chartDimension)?.label} />
            )}

            {activeTab === 'ratioChart' && aggregatedData && (
              <RatioChart data={aggregatedData} dimensionLabel={dimensionConfigs.find((d) => d.key === chartDimension)?.label} />
            )}

            {activeTab === 'detail' && aggregatedData && (
              <DataTable data={aggregatedData} dimensionLabel={dimensionConfigs.find((d) => d.key === chartDimension)?.label} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
