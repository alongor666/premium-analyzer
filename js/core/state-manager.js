/**
 * 全局状态管理器
 * 使用订阅发布模式管理应用状态
 */
class StateManager {
  constructor() {
    this.state = {
      // 原始数据
      rawData: null,

      // 筛选状态（参考autowrKPI的draft → applied模式）
      filters: {
        draft: {},      // 草稿状态 { dimension_key: [selectedValues] }
        applied: []     // 已应用 [{ key, values }]
      },

      // 当前聚合维度
      currentGroupBy: 'third_level_organization',

      // 当前标签页
      activeTab: 'overview',

      // 聚合结果缓存
      aggregatedData: null,

      // 全局统计
      globalStats: {
        totalPremium: 0,
        totalCount: 0,
        monthRange: []
      },

      // 维度唯一值
      dimensions: {},

      // UI状态
      ui: {
        activeDropdown: null,  // 当前打开的下拉选择器
        loading: false,
        error: null
      }
    };

    this.listeners = new Map(); // 状态监听器
  }

  /**
   * 订阅状态变化
   * @param {string} key - 状态键
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);

    // 返回取消订阅函数
    return () => {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  /**
   * 更新状态并通知监听器
   * @param {Object} updates - 状态更新对象
   */
  setState(updates) {
    const oldState = JSON.parse(JSON.stringify(this.state));

    // 深度合并更新
    this.state = this._deepMerge(this.state, updates);

    // 触发监听器
    Object.keys(updates).forEach(key => {
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach(cb => {
          try {
            cb(this.state[key], oldState[key]);
          } catch (error) {
            console.error(`[StateManager] 监听器错误 (${key}):`, error);
          }
        });
      }
    });

    // 触发通用监听器
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(cb => {
        try {
          cb(this.state, oldState);
        } catch (error) {
          console.error('[StateManager] 通用监听器错误:', error);
        }
      });
    }
  }

  /**
   * 获取状态
   * @param {string} key - 状态键，不传则返回全部状态
   * @returns {*} 状态值
   */
  getState(key) {
    if (!key) return this.state;
    return this._getNestedValue(this.state, key);
  }

  /**
   * 更新草稿筛选
   * @param {string} dimensionKey - 维度键
   * @param {Array} values - 选中的值
   */
  updateDraftFilter(dimensionKey, values) {
    this.setState({
      filters: {
        ...this.state.filters,
        draft: {
          ...this.state.filters.draft,
          [dimensionKey]: values
        }
      }
    });
  }

  /**
   * 应用筛选（draft → applied）
   */
  applyFilters() {
    const applied = Object.entries(this.state.filters.draft)
      .filter(([key, values]) => values && values.length > 0)
      .map(([key, values]) => ({ key, values }));

    this.setState({
      filters: {
        ...this.state.filters,
        applied
      }
    });

    // 保存到本地存储
    if (typeof window !== 'undefined' && window.StorageManager) {
      window.StorageManager.saveFilters(applied);
    }

    // 触发筛选应用事件
    window.EventBus.emit('filters:applied', applied);
  }

  /**
   * 清空筛选
   */
  clearFilters() {
    this.setState({
      filters: {
        draft: {},
        applied: []
      }
    });

    window.EventBus.emit('filters:cleared');
  }

  /**
   * 深度合并对象
   * @private
   */
  _deepMerge(target, source) {
    // 处理 null/undefined
    if (!source || typeof source !== 'object') {
      return source;
    }

    if (!target || typeof target !== 'object') {
      return source;
    }

    const output = { ...target };

    Object.keys(source).forEach(key => {
      const sourceValue = source[key];
      const targetValue = target[key];

      // 如果source值是null/undefined，直接设置
      if (sourceValue === null || sourceValue === undefined) {
        output[key] = sourceValue;
        return;
      }

      // 如果是数组，直接替换（不深度合并数组）
      if (Array.isArray(sourceValue)) {
        output[key] = sourceValue;
        return;
      }

      // 如果是普通对象，且目标也有这个key，进行深度合并
      if (sourceValue instanceof Object && !Array.isArray(sourceValue) && key in target) {
        output[key] = this._deepMerge(targetValue, sourceValue);
      } else {
        // 其他情况直接替换
        output[key] = sourceValue;
      }
    });

    return output;
  }

  /**
   * 获取嵌套值
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, part) => current?.[part], obj);
  }

  /**
   * 重置状态
   */
  reset() {
    this.state = {
      rawData: null,
      filters: { draft: {}, applied: [] },
      currentGroupBy: 'third_level_organization',
      activeTab: 'overview',
      aggregatedData: null,
      globalStats: { totalPremium: 0, totalCount: 0, monthRange: [] },
      dimensions: {},
      ui: { activeDropdown: null, loading: false, error: null }
    };

    window.EventBus.emit('state:reset');
  }
}

// 创建全局单例
const stateManager = new StateManager();

// 挂载到window
if (typeof window !== 'undefined') {
  window.StateManager = stateManager;
}
