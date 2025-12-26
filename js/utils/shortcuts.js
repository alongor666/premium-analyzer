/**
 * 快捷键管理
 */
class ShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      const key = this.getKeyString(e);
      const handler = this.shortcuts.get(key);

      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  }

  getKeyString(e) {
    const parts = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    parts.push(e.key.toUpperCase());
    return parts.join('+');
  }

  register(keyCombo, handler) {
    this.shortcuts.set(keyCombo, handler);
    console.log(`[Shortcut] 注册快捷键: ${keyCombo}`);
  }

  unregister(keyCombo) {
    this.shortcuts.delete(keyCombo);
  }

  clear() {
    this.shortcuts.clear();
  }
}

// 创建实例
const shortcutManager = new ShortcutManager();

// 等待应用初始化后注册快捷键
document.addEventListener('DOMContentLoaded', () => {
  // 延迟注册，确保app实例已创建
  setTimeout(() => {
    // Ctrl+S: 应用筛选
    shortcutManager.register('CTRL+S', () => {
      if (window.StateManager) {
        window.StateManager.applyFilters();
        console.log('[Shortcut] 筛选已应用');
      }
    });

    // Ctrl+R: 重置筛选
    shortcutManager.register('CTRL+R', () => {
      if (window.StateManager) {
        window.StateManager.clearFilters();
        if (window.app && window.app.components) {
          window.app.components.dimensionSelector.render();
          window.app.components.dimensionSelector.attachEvents();
          window.app.components.dimensionSelector.renderAppliedFilters();
        }
        console.log('[Shortcut] 筛选已重置');
      }
    });

    // Ctrl+E: 导出数据
    shortcutManager.register('CTRL+E', () => {
      const exportBtn = document.getElementById('exportBtn');
      if (exportBtn) {
        exportBtn.click();
      }
    });

    // 数字键1-4: 切换标签页
    ['1', '2', '3', '4'].forEach((num, index) => {
      shortcutManager.register(`CTRL+${num}`, () => {
        const tabs = ['overview', 'organization', 'dimension', 'detail'];
        if (window.app && window.app.switchTab) {
          window.app.switchTab(tabs[index]);
        }
      });
    });

    console.log('[Shortcut] 快捷键已初始化');
  }, 1000);
});

// 挂载到window
if (typeof window !== 'undefined') {
  window.ShortcutManager = shortcutManager;
}
