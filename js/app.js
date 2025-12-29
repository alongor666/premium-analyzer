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

      // 7. 初始化维度同步状态
      this.chartDimensionSelectors = new Map(); // 存储图表维度选择器实例
      this.chartableDimensions = this.config.dimensions.filter(d =>
        d.key !== 'start_month'  // 排除起保月，只保留可用于图表切换的维度
      );

      // 8. 监听维度同步事件
      window.EventBus.on('dimension:sync', (data) => {
        this.handleDimensionSync(data);
      });

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

    // 重新导入数据按钮
    const reloadDataBtn = document.getElementById('reloadDataBtn');
    if (reloadDataBtn) {
      reloadDataBtn.addEventListener('click', () => {
        this.reloadData();
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
  async switchTab(tabName) {
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
    await this.renderTabContent(tabName);
  }

  /**
   * 渲染标签页内容
   */
  async renderTabContent(tabName) {
    const aggregatedData = window.StateManager.getState('aggregatedData');
    const currentGroupBy = window.StateManager.getState('currentGroupBy');

    if (!aggregatedData || aggregatedData.length === 0) {
      console.warn('[App] 无聚合数据可渲染');
      return;
    }

    console.log(`[App] 渲染标签页: ${tabName}, 当前维度: ${currentGroupBy}`);

    switch(tabName) {
      case 'overview':
        // 概览页：只渲染趋势图（固定为起保月）
        await this.renderMonthTrendChart();
        break;

      case 'barChart':
        // 柱状图页：支持维度切换
        this.setupChartWithDimensionSelector(
          'barChartCard',
          'chartBarMain',
          'bar',
          aggregatedData,
          currentGroupBy
        );
        break;

      case 'ratioChart':
        // 占比图页：玫瑰图，支持维度切换
        this.setupChartWithDimensionSelector(
          'ratioChartCard',
          'chartRatioMain',
          'pie',
          aggregatedData,
          currentGroupBy,
          { roseType: 'area', maxItems: 6, showOthers: true }
        );
        break;

      case 'detail':
        // 明细数据页：表格
        this.renderDetailTable(aggregatedData);
        break;
    }
  }

  /**
   * 设置图表和维度选择器
   * @param {string} cardId - 图表卡片ID
   * @param {string} chartId - 图表容器ID
   * @param {string} chartType - 图表类型
   * @param {Array} data - 图表数据
   * @param {string} dimension - 当前维度
   * @param {Object} options - 图表选项
   */
  setupChartWithDimensionSelector(cardId, chartId, chartType, data, dimension, options = {}) {
    const cardElement = document.getElementById(cardId);
    if (!cardElement) {
      console.warn(`[App] 图表卡片不存在: ${cardId}`);
      return;
    }

    // 创建或更新维度选择器
    if (!this.chartDimensionSelectors.has(cardId)) {
      const isBarChart = chartType === 'bar';

      const selector = new ChartDimensionSelector({
        containerId: cardId,
        dimensions: this.chartableDimensions,
        currentDimension: dimension,
        syncMode: isBarChart,  // 柱状图显示同步开关
        onDimensionChange: (newDim) => this.handleChartDimensionChange(newDim, chartId, chartType, cardId)
      });

      selector.render();
      this.chartDimensionSelectors.set(cardId, selector);
    } else {
      // 更新现有选择器
      const selector = this.chartDimensionSelectors.get(cardId);
      selector.updateDimension(dimension);
    }

    // 渲染图表
    this.components.chartService.renderChart(chartId, chartType, data, options);
  }

  /**
   * 处理图表维度切换
   */
  async handleChartDimensionChange(newDimension, chartId, chartType, cardId) {
    console.log(`[App] 维度切换: ${chartId} -> ${newDimension}`);

    try {
      // 显示加载状态
      this.showLoading('正在切换维度...');

      // 更新全局状态
      window.StateManager.setState({ currentGroupBy: newDimension });

      // 重新聚合数据
      const filters = window.StateManager.getState('filters.applied');
      const result = await window.WorkerBridge.applyFilter(filters, newDimension);

      // 更新聚合数据状态
      window.StateManager.setState({ aggregatedData: result.aggregated });

      // 隐藏加载状态
      this.hideLoading();

      // 根据图表类型确定选项
      const options = chartType === 'pie'
        ? { roseType: 'area', maxItems: 6, showOthers: true }
        : {};

      // 重新渲染当前图表
      this.components.chartService.renderChart(chartId, chartType, result.aggregated, options);

    } catch (error) {
      console.error('[App] 维度切换失败:', error);
      this.hideLoading();
      this.showError('维度切换失败', error.message);
    }
  }

  /**
   * 处理维度同步
   */
  async handleDimensionSync(data) {
    const { dimension, source } = data;
    console.log(`[App] 维度同步事件: ${dimension}, 来源: ${source}`);

    // 获取所有需要同步的图表卡片
    const syncTargets = [];

    // 如果来源是柱状图，需要同步占比图
    if (source === 'barChartCard') {
      const ratioSelector = this.chartDimensionSelectors.get('ratioChartCard');
      if (ratioSelector && ratioSelector.isSyncEnabled()) {
        syncTargets.push({
          cardId: 'ratioChartCard',
          chartId: 'chartRatioMain',
          chartType: 'pie',
          options: { roseType: 'area', maxItems: 6, showOthers: true }
        });
      }
    }

    // 执行同步
    for (const target of syncTargets) {
      try {
        const selector = this.chartDimensionSelectors.get(target.cardId);
        if (selector) {
          selector.updateDimension(dimension);
        }

        // 重新聚合数据
        const filters = window.StateManager.getState('filters.applied');
        const result = await window.WorkerBridge.applyFilter(filters, dimension);

        // 更新状态
        window.StateManager.setState({ aggregatedData: result.aggregated });

        // 重新渲染图表
        this.components.chartService.renderChart(
          target.chartId,
          target.chartType,
          result.aggregated,
          target.options
        );

      } catch (error) {
        console.error(`[App] 同步失败 ${target.cardId}:`, error);
      }
    }
  }

  /**
   * 渲染月度趋势图（概览页专用）
   * 概览页固定使用起保月聚合，不受当前维度影响
   */
  async renderMonthTrendChart() {
    const currentGroupBy = window.StateManager.getState('currentGroupBy');

    // 如果当前不是按起保月聚合，需要重新聚合
    if (currentGroupBy !== 'start_month') {
      console.log('[App] 概览页需要按起保月聚合，重新查询...');

      try {
        // 显示加载状态
        this.showLoading('正在加载数据...');

        // 获取当前筛选条件
        const filters = window.StateManager.getState('filters.applied');

        // 按起保月重新聚合
        const result = await window.WorkerBridge.applyFilter(filters, 'start_month');

        // 隐藏加载状态
        this.hideLoading();

        // 渲染图表
        this.components.chartService.renderChart(
          'chartMonthTrend',
          'line',
          result.aggregated
        );

      } catch (error) {
        console.error('[App] 加载起保月数据失败:', error);
        this.hideLoading();
        this.showError('加载失败', error.message);
      }

    } else {
      // 当前已是按起保月聚合，直接使用现有数据
      const aggregatedData = window.StateManager.getState('aggregatedData');
      this.components.chartService.renderChart(
        'chartMonthTrend',
        'line',
        aggregatedData
      );
    }
  }

  /**
   * 渲染机构对比图（已废弃，保留兼容）
   */
  renderOrganizationComparison(data) {
    // 这个方法已被新的柱状图页替代
    console.warn('[App] renderOrganizationComparison 已废弃，请使用新的柱状图页');
  }

  /**
   * 渲染维度分析（已废弃，保留兼容）
   */
  renderDimensionAnalysis(data) {
    // 这个方法已被新的占比图页替代
    console.warn('[App] renderDimensionAnalysis 已废弃，请使用新的占比图页');
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

      // 渲染当前活动的标签页（默认为概览页）
      const activeTab = document.querySelector('.tab-item.active');
      if (activeTab) {
        const tabName = activeTab.dataset.tab;
        await this.renderTabContent(tabName);
      }

    } catch (error) {
      console.error('[App] 仪表盘渲染失败:', error);
      this.showError('仪表盘渲染失败', error.message);
    }
  }

  /**
   * 更新仪表盘（筛选后）
   */
  async updateDashboard(result) {
    const globalStats = window.StateManager.getState('globalStats');

    // 更新指标卡片
    const metrics = MetricCard.calculateMetrics({
      globalStats,
      aggregatedData: result.aggregated,
      summary: result.summary
    });
    this.components.metricCard.render(metrics);

    // 重新渲染当前活动的标签页
    const activeTab = document.querySelector('.tab-item.active');
    if (activeTab) {
      const tabName = activeTab.dataset.tab;
      await this.renderTabContent(tabName);
    }
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
   * 重新导入数据
   *
   * @description
   * 清空所有应用状态并返回文件上传界面，允许用户上传新的数据文件。
   * 此操作会清除所有已加载的数据、筛选条件和分析结果。
   *
   * @workflow
   * 1. 显示确认对话框，提示用户将丢失当前结果
   * 2. 清空 StateManager 中的所有数据状态
   * 3. 隐藏仪表盘区域，显示上传区域
   * 4. 重置所有 UI 元素（数据信息、按钮、文件输入）
   *
   * @fires None - 直接操作 DOM，不触发事件
   *
   * @example
   * // 用户点击"重新导入数据"按钮
   * reloadDataBtn.addEventListener('click', () => {
   *   this.reloadData();
   * });
   *
   * @see {@link file-uploader.js#showDashboard} 显示按钮的位置
   * @see {@link CLAUDE.md#data-reload-flow} 完整工作流程说明
   * @see {@link README.md#重新导入数据} 用户使用说明
   */
  reloadData() {
    // 确认操作
    const confirmed = confirm('确定要重新导入数据吗？\n\n当前的筛选和分析结果将会丢失。');
    if (!confirmed) {
      return;
    }

    console.log('[App] 重新导入数据');

    // 清空状态
    window.StateManager.setState({
      rawData: null,
      globalStats: null,
      aggregatedData: null,
      dimensions: null,
      filters: {
        draft: {},
        applied: {}
      }
    });

    // 隐藏仪表盘区域
    document.getElementById('dashboardSection').style.display = 'none';

    // 显示上传区域
    document.getElementById('uploadSection').style.display = 'flex';

    // 隐藏数据信息
    document.getElementById('dataInfo').style.display = 'none';

    // 隐藏重新导入按钮
    document.getElementById('reloadDataBtn').style.display = 'none';

    // 重置文件输入
    document.getElementById('fileInput').value = '';

    console.log('[App] 已重置为初始状态，可以重新上传文件');
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
