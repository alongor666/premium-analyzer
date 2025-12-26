/**
 * 指标卡片组件
 * 用于显示KPI指标
 */
class MetricCard {
  constructor(container) {
    this.container = container;
  }

  /**
   * 渲染指标卡片
   * @param {Array} metrics - 指标数据
   */
  render(metrics) {
    const html = metrics.map(metric => this.createCard(metric)).join('');
    this.container.innerHTML = html;
  }

  /**
   * 创建单个卡片
   * @param {Object} metric - 指标数据
   */
  createCard(metric) {
    const { title, value, subtext, trend, status = 'default' } = metric;

    const trendHtml = trend ? `
      <div class="metric-trend ${trend > 0 ? 'positive' : trend < 0 ? 'negative' : ''}">
        ${trend > 0 ? '↑' : trend < 0 ? '↓' : '—'} ${Math.abs(trend)}%
      </div>
    ` : '';

    const subtextHtml = subtext ? `<div class="metric-subtext">${subtext}</div>` : '';

    return `
      <div class="metric-card ${status}">
        <div class="metric-title">${title}</div>
        <div class="metric-value">${value}</div>
        ${subtextHtml}
        ${trendHtml}
      </div>
    `;
  }

  /**
   * 更新指标卡片
   * @param {number} index - 卡片索引
   * @param {Object} metric - 新的指标数据
   */
  update(index, metric) {
    const cards = this.container.querySelectorAll('.metric-card');
    if (cards[index]) {
      cards[index].outerHTML = this.createCard(metric);
    }
  }

  /**
   * 从数据计算指标
   * @param {Object} data - 数据对象
   * @returns {Array} 指标数组
   */
  static calculateMetrics(data) {
    const { globalStats, aggregatedData, summary } = data;

    const metrics = [
      {
        title: '总保费收入',
        value: formatPremium(globalStats?.totalPremium || 0),
        subtext: `共 ${globalStats?.totalCount || 0} 条记录`,
        status: 'primary'
      },
      {
        title: '已筛选保费',
        value: formatPremium(summary?.filteredPremium || globalStats?.totalPremium || 0),
        subtext: `占比 ${formatRatio(summary?.ratio || 1)}`,
        status: summary ? 'info' : 'default'
      },
      {
        title: '覆盖月份',
        value: globalStats?.monthRange?.length || 0,
        subtext: globalStats?.monthRange?.join(', ') || '暂无数据',
        status: 'success'
      },
      {
        title: '平均单均保费',
        value: formatPremium(
          globalStats?.totalPremium && globalStats?.totalCount
            ? globalStats.totalPremium / globalStats.totalCount
            : 0
        ),
        subtext: '单条记录平均值',
        status: 'default'
      }
    ];

    return metrics;
  }
}

// 挂载到window
if (typeof window !== 'undefined') {
  window.MetricCard = MetricCard;
}
