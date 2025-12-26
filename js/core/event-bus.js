/**
 * 事件总线 - 用于组件间通信解耦
 * 使用订阅发布模式
 */
class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event).push(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);

    if (index > -1) {
      callbacks.splice(index, 1);
    }

    // 如果没有订阅者了，删除事件
    if (callbacks.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 传递给回调的数据
   */
  emit(event, data) {
    if (!this.events.has(event)) return;

    const callbacks = this.events.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] 事件处理错误 (${event}):`, error);
      }
    });
  }

  /**
   * 一次性订阅（触发一次后自动取消）
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };

    this.on(event, onceCallback);
  }

  /**
   * 清空所有事件
   */
  clear() {
    this.events.clear();
  }

  /**
   * 获取事件列表
   * @returns {Array<string>} 事件名称列表
   */
  getEvents() {
    return Array.from(this.events.keys());
  }
}

// 创建全局单例
const eventBus = new EventBus();

// 如果是浏览器环境，挂载到window
if (typeof window !== 'undefined') {
  window.EventBus = eventBus;
}
