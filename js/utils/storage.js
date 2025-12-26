/**
 * 本地存储工具
 */
class StorageManager {
  constructor(prefix = 'premium_analyzer_') {
    this.prefix = prefix;
  }

  /**
   * 保存筛选配置
   */
  saveFilters(filters) {
    try {
      const key = this.prefix + 'filters';
      localStorage.setItem(key, JSON.stringify(filters));
      console.log('[Storage] 筛选配置已保存');
    } catch (error) {
      console.error('[Storage] 保存失败:', error);
    }
  }

  /**
   * 加载筛选配置
   */
  loadFilters() {
    try {
      const key = this.prefix + 'filters';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('[Storage] 加载失败:', error);
      return null;
    }
  }

  /**
   * 清除筛选配置
   */
  clearFilters() {
    try {
      const key = this.prefix + 'filters';
      localStorage.removeItem(key);
      console.log('[Storage] 筛选配置已清除');
    } catch (error) {
      console.error('[Storage] 清除失败:', error);
    }
  }

  /**
   * 保存用户偏好设置
   */
  savePreferences(preferences) {
    try {
      const key = this.prefix + 'preferences';
      localStorage.setItem(key, JSON.stringify(preferences));
      console.log('[Storage] 偏好设置已保存');
    } catch (error) {
      console.error('[Storage] 保存偏好设置失败:', error);
    }
  }

  /**
   * 加载用户偏好设置
   */
  loadPreferences() {
    try {
      const key = this.prefix + 'preferences';
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
      // 返回默认偏好设置
      return {
        autoSave: true,
        defaultGroupBy: 'third_level_organization',
        theme: 'light'
      };
    } catch (error) {
      console.error('[Storage] 加载偏好设置失败:', error);
      return {
        autoSave: true,
        defaultGroupBy: 'third_level_organization',
        theme: 'light'
      };
    }
  }

  /**
   * 清除所有数据
   */
  clearAll() {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
      console.log('[Storage] 所有数据已清除');
    } catch (error) {
      console.error('[Storage] 清除失败:', error);
    }
  }
}

// 创建全局实例
const storageManager = new StorageManager();

if (typeof window !== 'undefined') {
  window.StorageManager = storageManager;
}
