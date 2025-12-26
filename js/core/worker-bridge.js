/**
 * Worker通信桥接层
 * 参考：autowrKPI/js/static-report-generator.js
 * 使用一次性监听器模式防止内存泄漏
 */
class WorkerBridge {
  constructor() {
    this.worker = null;
    this.isReady = false;
    this.pendingRequests = new Map();
    this.cache = new Map(); // 添加缓存
  }

  /**
   * 初始化Worker
   */
  init() {
    if (this.worker) {
      console.warn('[WorkerBridge] Worker已经初始化');
      return;
    }

    try {
      this.worker = new Worker('js/workers/data.worker.js');
      this.isReady = true;
      console.log('[WorkerBridge] Worker初始化成功');
    } catch (error) {
      console.error('[WorkerBridge] Worker初始化失败:', error);
      throw new Error('Web Worker不可用，请使用现代浏览器');
    }
  }

  /**
   * 发送消息并等待响应（一次性监听器模式）
   * @param {string} type - 消息类型
   * @param {Object} payload - 消息负载
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Promise} 响应数据
   */
  sendMessage(type, payload, timeout = 30000) {
    if (!this.isReady) {
      return Promise.reject(new Error('Worker未初始化'));
    }

    return new Promise((resolve, reject) => {
      const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 创建一次性监听器
      const handler = (e) => {
        const { type: responseType, requestId: resId, payload: resPayload } = e.data;

        // 匹配请求ID
        if (resId === requestId) {
          // 立即移除监听器（关键：防止内存泄漏）
          this.worker.removeEventListener('message', handler);

          // 清除超时定时器
          if (timer) {
            clearTimeout(timer);
          }

          // 处理响应
          if (resPayload && resPayload.success) {
            resolve(resPayload.data);
          } else {
            reject(new Error(resPayload.error || '未知错误'));
          }
        }
      };

      // 添加监听器
      this.worker.addEventListener('message', handler);

      // 发送带ID的消息
      this.worker.postMessage({ type, payload, requestId });

      // 超时保护
      const timer = setTimeout(() => {
        this.worker.removeEventListener('message', handler);
        reject(new Error(`Worker超时 (${timeout}ms)`));
      }, timeout);
    });
  }

  /**
   * 解析文件
   * @param {File} file - 文件对象
   * @returns {Promise} 解析结果
   */
  async parseFile(file) {
    console.log('[WorkerBridge] 开始解析文件:', file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileType = file.name.endsWith('.csv') ? 'csv' : 'xlsx';

      const result = await this.sendMessage('PARSE_FILE', {
        fileContent: arrayBuffer,
        fileName: file.name,
        fileType
      });

      console.log('[WorkerBridge] 文件解析完成:', result);
      return result;
    } catch (error) {
      console.error('[WorkerBridge] 文件解析失败:', error);
      throw error;
    }
  }

  /**
   * 应用筛选并聚合
   * @param {Array} filters - 筛选条件 [{key, values}]
   * @param {string} groupBy - 聚合维度
   * @returns {Promise} 聚合结果
   */
  async applyFilter(filters, groupBy) {
    console.log('[WorkerBridge] 应用筛选:', filters, '聚合维度:', groupBy);

    // 生成缓存key
    const cacheKey = JSON.stringify({ filters, groupBy });

    // 检查缓存
    if (this.cache.has(cacheKey)) {
      console.log('[WorkerBridge] 使用缓存结果');
      return this.cache.get(cacheKey);
    }

    try {
      const result = await this.sendMessage('APPLY_FILTER', {
        filters,
        groupBy
      });

      // 存入缓存
      this.cache.set(cacheKey, result);

      // 限制缓存大小（最多保留20个）
      if (this.cache.size > 20) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      console.log('[WorkerBridge] 筛选完成，聚合数据条数:', result.aggregated?.length);
      return result;
    } catch (error) {
      console.error('[WorkerBridge] 筛选失败:', error);
      throw error;
    }
  }

  /**
   * 导出数据
   * @param {string} format - 导出格式（csv/json）
   * @param {boolean} filtered - 是否只导出筛选后的数据
   * @returns {Promise} 导出数据
   */
  async exportData(format = 'csv', filtered = true) {
    console.log('[WorkerBridge] 导出数据:', format, 'filtered:', filtered);

    try {
      const result = await this.sendMessage('EXPORT_DATA', {
        format,
        filtered
      });

      return result;
    } catch (error) {
      console.error('[WorkerBridge] 导出失败:', error);
      throw error;
    }
  }

  /**
   * 监听Worker进度事件
   * @param {Function} callback - 进度回调函数
   */
  onProgress(callback) {
    if (!this.worker) return;

    const handler = (e) => {
      if (e.data.type === 'PROGRESS') {
        callback(e.data.payload);
      }
    };

    this.worker.addEventListener('message', handler);

    // 返回取消监听函数
    return () => this.worker.removeEventListener('message', handler);
  }

  /**
   * 销毁Worker
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
      console.log('[WorkerBridge] Worker已销毁');
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('[WorkerBridge] 缓存已清除');
  }
}

// 创建全局单例
const workerBridge = new WorkerBridge();

// 挂载到window
if (typeof window !== 'undefined') {
  window.WorkerBridge = workerBridge;
}
