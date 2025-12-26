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
   */
  renderChart(containerId, chartType, data) {
    console.log(`[ChartService] 渲染图表: ${containerId}`, {
      chartType,
      dataLength: data?.length,
      dataSample: data?.slice(0, 2)
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
    }

    // 构建配置
    const option = this.buildOption(chartType, data);
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
  buildOption(chartType, data) {
    switch(chartType) {
      case 'line':
        return this.buildLineChart(data);
      case 'bar':
        return this.buildBarChart(data);
      case 'pie':
        return this.buildPieChart(data);
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
  buildBarChart(data) {
    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
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
            占比: ${formatRatio(dataItem.ratio)}<br/>
            记录数: ${dataItem.count}
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
   * 饼图配置
   */
  buildPieChart(data) {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}万元 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center'
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        data: data.map((d, index) => ({
          name: d.dimension,
          value: d.premium,
          itemStyle: {
            color: this.colors[index % this.colors.length]
          }
        })),
        label: {
          formatter: '{b}: {d}%'
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
