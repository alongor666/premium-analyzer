/**
 * ECharts图表服务
 * 参考：autowrKPI/js/dashboard.js的renderChart方法
 */
class ChartService {
  constructor() {
    this.charts = new Map(); // 存储ECharts实例
    this.colors = ['#0070c0', '#00b050', '#a02724', '#ffc000', '#5b9bd5', '#a9d18e', '#ffd966', '#f4b183', '#c5e0b4'];
  }

  /**
   * 创建或更新图表
   * @param {string} containerId - 容器ID
   * @param {string} chartType - 图表类型
   * @param {Array} data - 图表数据
   * @param {Object} options - 可选配置 { roseType, maxItems, showOthers }
   */
  renderChart(containerId, chartType, data, options = {}) {
    console.log(`[ChartService] 渲染图表: ${containerId}`, {
      chartType,
      dataLength: data?.length,
      dataSample: data?.slice(0, 2),
      options
    });

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`[ChartService] 容器不存在: ${containerId}`);
      return;
    }

    if (!data || data.length === 0) {
      console.warn(`[ChartService] 数据为空: ${containerId}`);
      return;
    }

    // 获取或创建ECharts实例
    let chart = this.charts.get(containerId);
    if (!chart) {
      console.log(`[ChartService] 创建新的ECharts实例: ${containerId}`);
      chart = echarts.init(container);
      this.charts.set(containerId, chart);

      // 响应式调整
      window.addEventListener('resize', () => chart.resize());

      // 绑定点击事件
      this.setupChartEvents(chart, chartType, containerId, data, options);
    }

    // 构建配置
    const option = this.buildOption(chartType, data, options);
    console.log(`[ChartService] ECharts配置:`, option);

    // 设置配置
    chart.setOption(option, true);
    console.log(`[ChartService] 图表渲染完成: ${containerId}`);

    return chart;
  }

  /**
   * 构建ECharts配置
   * 参考：autowrKPI/js/dashboard.js:404-616
   */
  buildOption(chartType, data, options = {}) {
    switch(chartType) {
      case 'line':
        return this.buildLineChart(data);
      case 'bar':
        return this.buildBarChart(data, options);
      case 'pie':
        return this.buildPieChart(data, options);
      default:
        return {};
    }
  }

  /**
   * 折线图配置（月度趋势）
   */
  buildLineChart(data) {
    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const param = params[0];
          return `${param.axisValue}<br/>${param.marker} ${param.seriesName}: ${formatPremium(param.value)}`;
        }
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.dimension),
        axisLabel: {
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: '保费收入(万元)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [{
        name: '保费收入',
        type: 'line',
        data: data.map(d => d.premium),
        smooth: true,
        itemStyle: {
          color: this.colors[0]
        },
        areaStyle: {
          opacity: 0.3
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => formatNumber(params.value, '0,0.0')
        },
        markLine: {
          data: [
            { type: 'average', name: '平均值' }
          ],
          label: {
            formatter: (params) => `平均: ${formatNumber(params.value, '0,0.0')}`
          }
        }
      }]
    };
  }

  /**
   * 柱状图配置（TOP5机构）
   * 参考：autowrKPI/js/dashboard.js:462-476（X轴优化）
   */
  buildBarChart(data, options = {}) {
    const { expandFromOthers = false } = options;

    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: expandFromOthers ? '10%' : '15%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const param = params[0];
          const dataItem = data[param.dataIndex];
          return `
            <strong>${param.axisValue}</strong><br/>
            ${param.marker} 保费收入: ${formatPremium(param.value)}<br/>
            占比: ${formatRatio(dataItem?.ratio || 0)}<br/>
            记录数: ${dataItem?.count || 0}
          `;
        }
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.dimension),
        axisLabel: {
          rotate: 45,                    // 标签倾斜45度避免重叠
          fontSize: 10,
          interval: 0,                   // 强制显示所有标签
          formatter: (value) => {
            // 超长文本截断
            return value.length > 8 ? value.slice(0, 8) + '...' : value;
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '保费收入(万元)'
      },
      series: [{
        name: '保费收入',
        type: 'bar',
        data: data.map(d => d.premium),
        itemStyle: {
          color: (params) => {
            // 根据排名使用不同颜色
            const colorIndex = Math.floor(params.dataIndex / 3);
            return this.colors[colorIndex % this.colors.length];
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: (params) => formatNumber(params.value, '0,0.0')
        }
      }]
    };
  }

  /**
   * 饼图/玫瑰图配置
   * 支持 TOP N + 其他，支持玫瑰图模式
   */
  buildPieChart(data, options = {}) {
    const {
      roseType = null,      // 'area' | 'radius' | null
      maxItems = 6,         // 最大显示数量
      showOthers = true     // 是否显示"其他"
    } = options;

    // 聚合数据：TOP N + 其他
    let chartData = [...data];
    let othersData = null;

    if (showOthers && data.length > maxItems) {
      const topItems = chartData.splice(0, maxItems);
      const othersPremium = chartData.reduce((sum, item) => sum + item.premium, 0);
      const othersCount = chartData.reduce((sum, item) => sum + item.count, 0);
      const totalPremium = data.reduce((sum, item) => sum + item.premium, 0);

      othersData = {
        dimension: '其他',
        premium: othersPremium,
        count: othersCount,
        ratio: othersPremium / totalPremium,
        isOthers: true  // 标记为其他项
      };

      chartData = [...topItems, othersData];
    }

    // 根据玫瑰图类型调整半径
    const radius = roseType ? ['20%', '70%'] : ['40%', '70%'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const dataItem = chartData[params.dataIndex];
          if (dataItem?.isOthers) {
            return `${params.name}: ${formatPremium(params.value)} (${params.percent}%)<br/>点击查看详情`;
          }
          return `${params.name}: ${formatPremium(params.value)} (${params.percent}%)`;
        }
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center'
      },
      series: [{
        type: 'pie',
        roseType: roseType,  // 'area' | 'radius' | undefined
        radius: radius,
        avoidLabelOverlap: true,
        data: chartData.map((d, index) => ({
          name: d.dimension,
          value: d.premium,
          itemStyle: {
            color: d.isOthers ? '#999999' : this.colors[index % this.colors.length]
          }
        })),
        label: {
          formatter: roseType ? '{b}\n{d}%' : '{b}: {d}%'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  }

  /**
   * 设置图表点击事件
   */
  setupChartEvents(chartInstance, chartType, containerId, originalData, options) {
    // 为饼图/玫瑰图添加点击"其他"展开事件
    if (chartType === 'pie' && options.showOthers) {
      chartInstance.off('click');
      chartInstance.on('click', (params) => {
        if (params.name === '其他') {
          console.log('[ChartService] 点击"其他"，展开为柱状图');
          // 展开为柱状图，显示全部数据
          this.renderChart(containerId, 'bar', originalData, { expandFromOthers: true });
        }
      });
    }
  }

  /**
   * 销毁图表
   */
  dispose(containerId) {
    const chart = this.charts.get(containerId);
    if (chart) {
      chart.dispose();
      this.charts.delete(containerId);
    }
  }

  /**
   * 销毁所有图表
   */
  disposeAll() {
    this.charts.forEach(chart => chart.dispose());
    this.charts.clear();
  }
}

// 挂载到window
if (typeof window !== 'undefined') {
  window.ChartService = ChartService;
}
