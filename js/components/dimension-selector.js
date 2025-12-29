/**
 * 维度筛选器组件
 * 参考：autowrKPI/js/dashboard.js:1496-1907
 * 电商式下拉筛选，支持draft → applied模式
 */
class DimensionSelector {
  constructor(container, dimensionsConfig) {
    this.container = container;
    this.dimensionsConfig = dimensionsConfig;
    this.dimensionValues = {}; // 存储每个维度的可选值
    this.activeDropdown = null; // 当前打开的下拉框
  }

  /**
   * 初始化（在数据加载后调用）
   * @param {Object} dimensions - 维度唯一值 {dimension_key: [values]}
   */
  init(dimensions) {
    this.dimensionValues = dimensions;
    this.render();
    this.attachEvents();
    console.log('[DimensionSelector] 初始化完成');
  }

  /**
   * 渲染筛选器
   */
  render() {
    const html = this.dimensionsConfig.map(dim => this.renderDimension(dim)).join('');
    this.container.innerHTML = html;
  }

  /**
   * 渲染单个维度筛选器
   * 安全版本：使用escapeHtml防止XSS攻击
   */
  renderDimension(dimension) {
    const draftValues = window.StateManager.getState('filters')?.draft[dimension.key] || [];
    const availableValues = this.dimensionValues[dimension.key] || [];

    const selectedCount = draftValues.length;
    const selectedCountHtml = selectedCount > 0
      ? `<span class="selected-count">${selectedCount}</span>`
      : '';

    // 转义维度标签（虽然来自配置，但为了安全一致性也转义）
    const safeLabel = window.SecurityUtils?.escapeHtml(dimension.label) || dimension.label;
    const safeKey = window.SecurityUtils?.escapeHtmlAttribute(dimension.key) || dimension.key;
    const safeColor = window.SecurityUtils?.escapeHtmlAttribute(dimension.color) || dimension.color;

    // 转义维度值（来自用户数据，必须转义）
    const optionsHtml = availableValues.map(value => {
      const safeValue = window.SecurityUtils?.escapeHtmlAttribute(value) || value;
      const safeDisplayValue = window.SecurityUtils?.escapeHtml(value) || value;
      const isChecked = draftValues.includes(value) ? 'checked' : '';

      return `
        <label class="option-item">
          <input type="checkbox"
                 value="${safeValue}"
                 ${isChecked}>
          <span>${safeDisplayValue}</span>
        </label>
      `;
    }).join('');

    return `
      <div class="dimension-item" data-key="${safeKey}">
        <div class="dimension-header" style="border-left-color: ${safeColor}">
          <span class="dimension-label">${safeLabel}</span>
          ${selectedCountHtml}
          <span class="dropdown-icon">▼</span>
        </div>

        <div class="dimension-dropdown" style="display: none;">
          <div class="dropdown-header">
            <span class="dropdown-title">${safeLabel}</span>
            <div class="dropdown-actions">
              <button class="btn btn-xs btn-invert" data-action="invert-selection">反选</button>
              <button class="btn-close-dropdown">×</button>
            </div>
          </div>

          <div class="dropdown-options">
            <label class="option-item select-all">
              <input type="checkbox" data-action="select-all">
              <span>全选 (${availableValues.length})</span>
            </label>
            <div class="options-list">
              ${optionsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 绑定事件
   */
  attachEvents() {
    // 点击维度头部切换下拉框
    this.container.querySelectorAll('.dimension-header').forEach(header => {
      header.addEventListener('click', (e) => {
        const dimensionItem = e.currentTarget.closest('.dimension-item');
        const key = dimensionItem.dataset.key;
        this.toggleDropdown(key);
      });
    });

    // 关闭下拉框按钮
    this.container.querySelectorAll('.btn-close-dropdown').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dimensionItem = e.currentTarget.closest('.dimension-item');
        const key = dimensionItem.dataset.key;
        this.closeDropdown(key);
      });
    });

    // 反选按钮
    this.container.querySelectorAll('[data-action="invert-selection"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dimensionItem = e.currentTarget.closest('.dimension-item');
        const key = dimensionItem.dataset.key;
        this.handleInvertSelection(key);
      });
    });

    // 复选框变化更新draft状态
    this.container.querySelectorAll('.option-item input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const dimensionItem = e.target.closest('.dimension-item');
        const key = dimensionItem.dataset.key;

        if (e.target.dataset.action === 'select-all') {
          // 全选/取消全选
          this.handleSelectAll(key, e.target.checked);
        } else {
          // 单个选择
          this.updateDraftFilter(key);
        }
      });
    });

    // 点击其他地方关闭下拉框
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dimension-item')) {
        this.closeAllDropdowns();
      }
    });
  }

  /**
   * 切换下拉框
   * 参考：autowrKPI/js/dashboard.js:1909-1977
   */
  toggleDropdown(dimensionKey) {
    // 关闭其他下拉框（参考autowrKPI的activeDropdown模式）
    if (this.activeDropdown && this.activeDropdown !== dimensionKey) {
      this.closeDropdown(this.activeDropdown);
    }

    const dimensionItem = this.container.querySelector(`[data-key="${dimensionKey}"]`);
    const dropdown = dimensionItem.querySelector('.dimension-dropdown');

    if (dropdown.style.display === 'none') {
      dropdown.style.display = 'block';
      this.activeDropdown = dimensionKey;
    } else {
      dropdown.style.display = 'none';
      this.activeDropdown = null;
    }
  }

  /**
   * 关闭下拉框
   */
  closeDropdown(dimensionKey) {
    const dimensionItem = this.container.querySelector(`[data-key="${dimensionKey}"]`);
    if (dimensionItem) {
      const dropdown = dimensionItem.querySelector('.dimension-dropdown');
      dropdown.style.display = 'none';
    }

    if (this.activeDropdown === dimensionKey) {
      this.activeDropdown = null;
    }
  }

  /**
   * 关闭所有下拉框
   */
  closeAllDropdowns() {
    this.container.querySelectorAll('.dimension-dropdown').forEach(dropdown => {
      dropdown.style.display = 'none';
    });
    this.activeDropdown = null;
  }

  /**
   * 处理全选/取消全选
   */
  handleSelectAll(dimensionKey, checked) {
    const dimensionItem = this.container.querySelector(`[data-key="${dimensionKey}"]`);
    const checkboxes = dimensionItem.querySelectorAll('.options-list input[type="checkbox"]');

    checkboxes.forEach(cb => {
      cb.checked = checked;
    });

    this.updateDraftFilter(dimensionKey);
  }

  /**
   * 处理反选
   */
  handleInvertSelection(dimensionKey) {
    const dimensionItem = this.container.querySelector(`[data-key="${dimensionKey}"]`);
    const checkboxes = dimensionItem.querySelectorAll('.options-list input[type="checkbox"]');

    // 反转所有复选框状态
    checkboxes.forEach(cb => {
      cb.checked = !cb.checked;
    });

    // 更新draft筛选
    this.updateDraftFilter(dimensionKey);
  }

  /**
   * 更新draft筛选
   */
  updateDraftFilter(dimensionKey) {
    const dimensionItem = this.container.querySelector(`[data-key="${dimensionKey}"]`);
    const checkboxes = dimensionItem.querySelectorAll('.options-list input[type="checkbox"]:checked');

    const selectedValues = Array.from(checkboxes).map(cb => cb.value);

    // 更新StateManager的draft状态
    window.StateManager.updateDraftFilter(dimensionKey, selectedValues);

    // 更新选中计数显示
    this.updateSelectedCount(dimensionKey, selectedValues.length);

    // 更新全选复选框状态
    this.updateSelectAllCheckbox(dimensionKey);
  }

  /**
   * 更新选中计数显示
   */
  updateSelectedCount(dimensionKey, count) {
    const dimensionItem = this.container.querySelector(`[data-key="${dimensionKey}"]`);
    const header = dimensionItem.querySelector('.dimension-header');

    let countElem = header.querySelector('.selected-count');

    if (count > 0) {
      if (!countElem) {
        countElem = document.createElement('span');
        countElem.className = 'selected-count';
        header.insertBefore(countElem, header.querySelector('.dropdown-icon'));
      }
      countElem.textContent = count;
    } else {
      if (countElem) {
        countElem.remove();
      }
    }
  }

  /**
   * 更新全选复选框状态
   */
  updateSelectAllCheckbox(dimensionKey) {
    const dimensionItem = this.container.querySelector(`[data-key="${dimensionKey}"]`);
    const selectAllCb = dimensionItem.querySelector('[data-action="select-all"]');
    const checkboxes = dimensionItem.querySelectorAll('.options-list input[type="checkbox"]');
    const checkedCount = dimensionItem.querySelectorAll('.options-list input[type="checkbox"]:checked').length;

    selectAllCb.checked = checkedCount === checkboxes.length;
    selectAllCb.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
  }

  /**
   * 渲染已应用的筛选标签
   * 安全版本：使用escapeHtml防止XSS攻击
   */
  renderAppliedFilters() {
    const appliedFilters = window.StateManager.getState('filters')?.applied || [];
    const filterTagsContainer = document.getElementById('filterTags');

    if (appliedFilters.length === 0) {
      filterTagsContainer.innerHTML = '<span class="no-filters">暂无筛选条件</span>';
      return;
    }

    const html = appliedFilters.map(filter => {
      const dimension = this.dimensionsConfig.find(d => d.key === filter.key);
      const color = dimension?.color || '#999';

      // 转义所有动态内容
      const safeKey = window.SecurityUtils?.escapeHtmlAttribute(filter.key) || filter.key;
      const safeColor = window.SecurityUtils?.escapeHtmlAttribute(color) || color;
      const safeLabel = window.SecurityUtils?.escapeHtml(dimension?.label || filter.key) || filter.key;
      const safeValues = filter.values
        .map(v => window.SecurityUtils?.escapeHtml(v) || v)
        .join(', ');

      return `
        <div class="filter-tag" data-key="${safeKey}" style="border-left-color: ${safeColor}">
          <span class="filter-tag-label">${safeLabel}:</span>
          <span class="filter-tag-values">${safeValues}</span>
          <button class="filter-tag-remove" data-key="${safeKey}">×</button>
        </div>
      `;
    }).join('');

    filterTagsContainer.innerHTML = html;

    // 绑定移除事件
    filterTagsContainer.querySelectorAll('.filter-tag-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.target.dataset.key;
        this.removeFilter(key);
      });
    });
  }

  /**
   * 移除单个筛选条件
   */
  removeFilter(dimensionKey) {
    // 清空draft
    window.StateManager.updateDraftFilter(dimensionKey, []);

    // 重新应用筛选
    window.StateManager.applyFilters();

    // 重新渲染
    this.render();
    this.attachEvents();
    this.renderAppliedFilters();
  }
}

// 挂载到window
if (typeof window !== 'undefined') {
  window.DimensionSelector = DimensionSelector;
}
