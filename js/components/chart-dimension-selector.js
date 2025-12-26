/**
 * 图表维度选择器组件
 * 为每个图表提供独立的维度切换功能
 */
class ChartDimensionSelector {
  /**
   * @param {Object} config - 配置对象
   * @param {string} config.containerId - 图表卡片容器ID
   * @param {Array} config.dimensions - 可选维度列表（排除起保月）
   * @param {string} config.currentDimension - 当前选中的维度
   * @param {Function} config.onDimensionChange - 维度切换回调
   * @param {boolean} config.syncMode - 是否显示同步开关
   */
  constructor(config) {
    this.containerId = config.containerId;
    this.dimensions = config.dimensions.filter(d => d.key !== 'start_month');
    this.currentDimension = config.currentDimension;
    this.onDimensionChange = config.onDimensionChange;
    this.syncMode = config.syncMode || false;
  }

  /**
   * 渲染维度选择器
   */
  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn(`[ChartDimensionSelector] 容器不存在: ${this.containerId}`);
      return;
    }

    // 检查是否已渲染
    if (container.querySelector('.chart-dimension-selector')) {
      console.log('[ChartDimensionSelector] 已渲染，跳过');
      return;
    }

    const chartHeader = container.querySelector('.chart-header');
    if (!chartHeader) {
      console.warn(`[ChartDimensionSelector] chart-header不存在: ${this.containerId}`);
      return;
    }

    // 生成维度选项HTML
    const optionsHtml = this.dimensions.map(dim =>
      `<option value="${dim.key}" ${dim.key === this.currentDimension ? 'selected' : ''}>
        ${dim.label}
      </option>`
    ).join('');

    // 生成同步开关HTML
    const syncHtml = this.syncMode ? `
      <label class="sync-toggle">
        <input type="checkbox" id="syncCheck_${this.containerId}" checked>
        同步占比图
      </label>
    ` : '';

    // 插入维度选择器HTML
    const selectorHtml = `
      <div class="chart-dimension-selector">
        <label>分组维度：</label>
        <select class="dimension-select" id="dimensionSelect_${this.containerId}">
          ${optionsHtml}
        </select>
        ${syncHtml}
      </div>
    `;

    // 插入到标题后面
    const titleElement = chartHeader.querySelector('.chart-title');
    titleElement.insertAdjacentHTML('afterend', selectorHtml);

    // 绑定事件
    this.bindEvents();

    console.log(`[ChartDimensionSelector] 渲染完成: ${this.containerId}`);
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    const container = document.getElementById(this.containerId);

    // 维度选择下拉框事件
    const select = container.querySelector('.dimension-select');
    if (select) {
      select.addEventListener('change', (e) => {
        const newDimension = e.target.value;
        this.currentDimension = newDimension;

        console.log(`[ChartDimensionSelector] 维度切换: ${this.containerId} -> ${newDimension}`);

        // 处理同步逻辑
        if (this.syncMode) {
          const syncCheckbox = container.querySelector('.sync-toggle input');
          if (syncCheckbox && syncCheckbox.checked) {
            // 触发全局同步事件
            window.EventBus.emit('dimension:sync', {
              dimension: newDimension,
              source: this.containerId
            });
          }
        }

        // 调用回调
        if (this.onDimensionChange) {
          this.onDimensionChange(newDimension);
        }
      });
    }

    // 同步开关事件
    if (this.syncMode) {
      const syncCheckbox = container.querySelector('.sync-toggle input');
      if (syncCheckbox) {
        syncCheckbox.addEventListener('change', (e) => {
          console.log(`[ChartDimensionSelector] 同步开关: ${this.containerId} -> ${e.target.checked}`);
        });
      }
    }
  }

  /**
   * 更新当前维度
   */
  updateDimension(newDimension) {
    this.currentDimension = newDimension;
    const container = document.getElementById(this.containerId);
    const select = container?.querySelector('.dimension-select');
    if (select) {
      select.value = newDimension;
    }
  }

  /**
   * 获取当前维度
   */
  getCurrentDimension() {
    return this.currentDimension;
  }

  /**
   * 是否启用同步
   */
  isSyncEnabled() {
    if (!this.syncMode) return false;

    const container = document.getElementById(this.containerId);
    const syncCheckbox = container?.querySelector('.sync-toggle input');
    return syncCheckbox ? syncCheckbox.checked : false;
  }
}

// 挂载到window
if (typeof window !== 'undefined') {
  window.ChartDimensionSelector = ChartDimensionSelector;
}
