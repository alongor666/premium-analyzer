/**
 * 应用入口
 * 初始化应用并协调各组件
 */
class PremiumAnalyzer {
  constructor() {
    this.config = null;
    this.components = {};
    this.isInitialized = false;
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      console.log('[App] 开始初始化...');

      // 1. 加载配置文件
      await this.loadConfig();

      // 2. 初始化Worker
      window.WorkerBridge.init();

      // 3. 创建UI组件
      this.createComponents();

      // 4. 绑定全局事件
      this.attachGlobalEvents();

      // 5. 绑定UI事件
      this.attachUIEvents();

      // 6. 加载保存的筛选配置
      this.loadSavedFilters();

      this.isInitialized = true;
      console.log('[App] 初始化完成');

    } catch (error) {
      console.error('[App] 初始化失败:', error);
      this.showError('应用初始化失败', error.message + '\n请刷新页面重试');
    }
  }

  /**
   * 加载保存的筛选配置
   */
  loadSavedFilters() {
    if (typeof window !== 'undefined' && window.StorageManager) {
      const savedFilters = window.StorageManager.loadFilters();
      if (savedFilters && savedFilters.length > 0) {
        console.log('[App] 检测到保存的筛选配置:', savedFilters);
        // 注意：这里只是记录，不自动应用，等待用户确认
        // 可选：可以显示提示让用户选择是否恢复筛选
      }
    }
  }

  /**
   * 加载配置文件
   */
  async loadConfig() {
    try {
      const [dimensions, appConfig] = await Promise.all([
        fetch('config/dimensions.json').then(r => r.json()),
        fetch('config/app-config.json').then(r => r.json())
      ]);

      this.config = {
        dimensions: dimensions.dimensions,
        metric: dimensions.metric,
        ...appConfig
      };

      console.log('[App] 配置加载完成:', this.config);
    } catch (error) {
      throw new Error('配置文件加载失败: ' + error.message);
    }
  }

  /**
   * 创建UI组件
   */
  createComponents() {
    // 文件上传组件
    this.components.fileUploader = new FileUploader(
      document.getElementById('uploadArea'),
      window.WorkerBridge
    );

    // 监听Worker进度事件
    window.WorkerBridge.onProgress((payload) => {
      this.updateProgress(payload);
    });

    // 图表服务
    this.components.chartService = new ChartService();

    // 指标卡片
    this.components.metricCard = new MetricCard(
      document.getElementById('metricsGrid')
    );

    // 维度筛选器（初始化时为空，数据加载后才渲染）
    this.components.dimensionSelector = new DimensionSelector(
      document.getElementById('dimensionSelectors'),
      this.config.dimensions
    );

    console.log('[App] 组件创建完成');
  }

  /**
   * 绑定全局事件
   */
  attachGlobalEvents() {
    // 监听文件解析完成
    window.EventBus.on('file:parsed', (result) => {
      console.log('[App] 文件解析完成:', result);

      // 保存数据到状态管理器
      window.StateManager.setState({
        rawData: result,
        globalStats: {
          totalPremium: result.premium,
          totalCount: result.total,
          monthRange: result.monthRange
        },
        dimensions: result.dimensions
      });

      // 初始化维度筛选器
      this.components.dimensionSelector.init(result.dimensions);

      // 渲染初始仪表盘（无筛选条件）
      this.renderDashboard();
    });

    // 监听筛选应用
    window.EventBus.on('filters:applied', async (filters) => {
      console.log('[App] 筛选已应用:', filters);

      try {
        // 显示加载状态
        this.showLoading('正在筛选数据...');

        // 调用Worker进行筛选和聚合
        const groupBy = window.StateManager.getState('currentGroupBy');
        const result = await window.WorkerBridge.applyFilter(filters, groupBy);

        // 更新状态
        window.StateManager.setState({
          aggregatedData: result.aggregated,
          summary: result.summary
        });

        // 隐藏加载状态
        this.hideLoading();

        // 更新图表和指标
        this.updateDashboard(result);

        // 更新已应用筛选标签
        this.components.dimensionSelector.renderAppliedFilters();

      } catch (error) {
        console.error('[App] 筛选失败:', error);
        this.hideLoading();
        this.showError('筛选失败', error.message);
      }
    });

    // 监听筛选清空
    window.EventBus.on('filters:cleared', () => {
      console.log('[App] 筛选已清空');
      this.renderDashboard(); // 重新渲染初始状态
    });
  }

  /**
   * 绑定UI事件
   */
  attachUIEvents() {
    // 应用筛选按钮
    document.getElementById('applyFilterBtn').addEventListener('click', () => {
      window.StateManager.applyFilters();
    });

    // 清空筛选按钮
    document.getElementById('clearFilterBtn').addEventListener('click', () => {
      window.StateManager.clearFilters();
      this.components.dimensionSelector.render();
      this.components.dimensionSelector.attachEvents();
      this.components.dimensionSelector.renderAppliedFilters();
    });

    // 标签页切换
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const targetTab = e.target.dataset.tab;
        this.switchTab(targetTab);
      });
    });

    // 导出数据按钮
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportData();
      });
    }

    // 错误模态框关闭
    document.getElementById('modalCloseBtn').addEventListener('click', () => {
      document.getElementById('errorModal').style.display = 'none';
    });

    document.getElementById('errorConfirmBtn').addEventListener('click', () => {
      document.getElementById('errorModal').style.display = 'none';
    });
  }

  /**
   * 切换标签页
   */
  switchTab(tabName) {
    // 更新导航按钮状态
    document.querySelectorAll('.tab-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.tab === tabName) {
        item.classList.add('active');
      }
    });

    // 更新内容区域
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });

    const targetContent = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (targetContent) {
      targetContent.classList.add('active');
    }

    // 根据标签页渲染对应内容
    this.renderTabContent(tabName);
  }

  /**
   * 渲染标签页内容
   */
  renderTabContent(tabName) {
    const aggregatedData = window.StateManager.getState('aggregatedData');
    const globalStats = window.StateManager.getState('globalStats');

    switch(tabName) {
      case 'overview':
        // 已有的概览页渲染
        break;

      case 'organization':
        // 机构对比页：显示所有机构的横向对比柱状图
        this.renderOrganizationComparison(aggregatedData);
        break;

      case 'dimension':
        // 维度分析页：饼图+柱状图
        this.renderDimensionAnalysis(aggregatedData);
        break;

      case 'detail':
        // 明细数据页：表格
        this.renderDetailTable(aggregatedData);
        break;
    }
  }

  /**
   * 渲染机构对比图
   */
  renderOrganizationComparison(data) {
    if (!data || data.length === 0) {
      console.warn('[App] 无数据可渲染机构对比图');
      return;
    }

    this.components.chartService.renderChart(
      'chartOrgComparison',
      'bar',
      data
    );
  }

  /**
   * 渲染维度分析
   */
  renderDimensionAnalysis(data) {
    if (!data || data.length === 0) {
      console.warn('[App] 无数据可渲染维度分析图');
      return;
    }

    // 饼图 - 显示TOP10
    const top10 = data.slice(0, 10);
    this.components.chartService.renderChart(
      'chartDimensionPie',
      'pie',
      top10
    );

    // 柱状图 - 显示TOP20
    this.components.chartService.renderChart(
      'chartDimensionBar',
      'bar',
      data.slice(0, 20)
    );
  }

  /**
   * 渲染明细数据表格
   */
  renderDetailTable(data) {
    if (!data || data.length === 0) {
      console.warn('[App] 无数据可渲染明细表');
      return;
    }

    const tableContainer = document.getElementById('dataTable');

    let html = '<table class="detail-table"><thead><tr>';
    html += '<th>维度</th><th>保费收入（万元）</th><th>占比</th><th>记录数</th>';
    html += '</tr></thead><tbody>';

    data.forEach(row => {
      const formattedPremium = (row.premium / 10000).toFixed(2);
      const formattedRatio = (row.ratio * 100).toFixed(2) + '%';
      html += `<tr>
        <td>${row.dimension}</td>
        <td>${formattedPremium}</td>
        <td>${formattedRatio}</td>
        <td>${row.count}</td>
      </tr>`;
    });

    html += '</tbody></table>';
    tableContainer.innerHTML = html;
  }

  /**
   * 渲染初始仪表盘（无筛选条件）
   */
  async renderDashboard() {
    try {
      const globalStats = window.StateManager.getState('globalStats');
      const groupBy = window.StateManager.getState('currentGroupBy');

      // 调用Worker进行初始聚合
      const result = await window.WorkerBridge.applyFilter([], groupBy);

      // 更新状态
      window.StateManager.setState({
        aggregatedData: result.aggregated
      });

      // 渲染指标卡片
      const metrics = MetricCard.calculateMetrics({
        globalStats,
        aggregatedData: result.aggregated
      });
      this.components.metricCard.render(metrics);

      // 渲染图表
      this.renderCharts(result.aggregated, globalStats.monthRange);

    } catch (error) {
      console.error('[App] 仪表盘渲染失败:', error);
      this.showError('仪表盘渲染失败', error.message);
    }
  }

  /**
   * 更新仪表盘（筛选后）
   */
  updateDashboard(result) {
    const globalStats = window.StateManager.getState('globalStats');

    // 更新指标卡片
    const metrics = MetricCard.calculateMetrics({
      globalStats,
      aggregatedData: result.aggregated,
      summary: result.summary
    });
    this.components.metricCard.render(metrics);

    // 更新图表
    this.renderCharts(result.aggregated, globalStats.monthRange);
  }

  /**
   * 渲染图表
   */
  renderCharts(aggregatedData, monthRange) {
    console.log('[App] renderCharts 调用:', {
      aggregatedDataLength: aggregatedData?.length,
      aggregatedDataSample: aggregatedData?.slice(0, 2),
      monthRange
    });

    if (!aggregatedData || aggregatedData.length === 0) {
      console.warn('[App] 聚合数据为空，无法渲染图表');
      return;
    }

    const groupBy = window.StateManager.getState('currentGroupBy');

    // 月度趋势图（如果按月份聚合）
    if (groupBy === 'start_month' && monthRange && monthRange.length > 0) {
      console.log('[App] 渲染月度趋势图（按月份）');
      this.components.chartService.renderChart('chartMonthTrend', 'line', aggregatedData);
    } else {
      // 否则显示TOP5
      const top5 = aggregatedData.slice(0, 5);
      console.log('[App] 渲染月度趋势图（TOP5）:', top5);
      this.components.chartService.renderChart('chartMonthTrend', 'line', top5);
    }

    // TOP5机构柱状图
    const top5Orgs = aggregatedData.slice(0, 5);
    console.log('[App] 渲染TOP5机构图:', top5Orgs);
    this.components.chartService.renderChart('chartTopOrganizations', 'bar', top5Orgs);
  }

  /**
   * 显示加载状态
   */
  showLoading(text) {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    loadingText.textContent = text;
    overlay.style.display = 'flex';
  }

  /**
   * 隐藏加载状态
   */
  hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
  }

  /**
   * 更新进度条
   */
  updateProgress(payload) {
    const { stage, percent } = payload;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('loadingProgress');

    if (progressFill) {
      progressFill.style.width = percent + '%';
    }
    if (progressText) {
      progressText.textContent = percent + '%';
    }

    console.log(`[App] ${stage} 进度: ${percent}%`);
  }

  /**
   * 显示错误
   */
  showError(title, message) {
    const modal = document.getElementById('errorModal');
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    modal.style.display = 'flex';
  }

  /**
   * 导出数据
   */
  exportData() {
    const aggregatedData = window.StateManager.getState('aggregatedData');

    if (!aggregatedData || aggregatedData.length === 0) {
      this.showError('导出失败', '没有可导出的数据');
      return;
    }

    // 显示导出选项
    const useExcel = confirm('导出为Excel？\n\n确定 = Excel格式 (.xlsx)\n取消 = CSV格式 (.csv)');

    const date = new Date().toISOString().slice(0, 10);
    const filename = `保费分析_${date}`;

    try {
      if (useExcel) {
        window.DataExporter.exportToExcel(aggregatedData, filename + '.xlsx');
      } else {
        window.DataExporter.exportToCSV(aggregatedData, filename + '.csv');
      }
      console.log('[App] 数据导出成功');
    } catch (error) {
      console.error('[App] 导出失败:', error);
      this.showError('导出失败', error.message);
    }
  }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
  window.app = new PremiumAnalyzer();
  window.app.init();
});
