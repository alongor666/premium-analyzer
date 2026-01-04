/**
 * 全局错误处理器
 */
class ErrorHandler {
  /**
   * 处理错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文（如 'App.parseFile'）
   * @param {boolean} showToUser - 是否向用户显示错误
   */
  static handle(error, context = '', showToUser = true) {
    // 记录错误
    logger.error(`[${context}]`, error);

    // 可选：发送到错误追踪服务（如Sentry）
    // this.sendToErrorTracking(error, context);

    // 显示用户友好的错误消息
    if (showToUser && window.app) {
      const message = this.getUserMessage(error);
      window.app.showError(context || '操作失败', message);
    }
  }

  /**
   * 获取用户友好的错误消息
   * @param {Error} error - 错误对象
   * @returns {string} 用户友好的错误消息
   */
  static getUserMessage(error) {
    const message = error.message || error.toString();

    // 网络相关错误
    if (message.includes('网络') || message.includes('Network') || message.includes('fetch')) {
      return '网络连接失败，请检查网络后重试';
    }

    // 文件相关错误
    if (message.includes('文件') || message.includes('File')) {
      if (message.includes('格式') || message.includes('format')) {
        return '文件格式不正确，请上传有效的Excel或CSV文件';
      }
      if (message.includes('大小') || message.includes('size')) {
        return '文件大小超过限制（最大200MB），请压缩后重试';
      }
      return '文件读取失败，请确保文件有效且未损坏';
    }

    // Worker相关错误
    if (message.includes('Worker')) {
      return '数据处理出错，请刷新页面重试';
    }

    // 解析相关错误
    if (message.includes('解析') || message.includes('parse')) {
      return '数据解析失败，请检查文件格式是否正确';
    }

    // 默认错误消息
    return '操作失败：' + message;
  }

  /**
   * 处理异步错误（用于Promise.catch）
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  static handleAsync(error, context = '') {
    this.handle(error, context, true);
  }

  /**
   * 创建错误处理装饰器
   * @param {string} context - 错误上下文
   * @param {boolean} showToUser - 是否向用户显示错误
   * @returns {Function} 装饰器函数
   */
  static decorate(context, showToUser = true) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          ErrorHandler.handle(error, context, showToUser);
          throw error; // 重新抛出以便上层处理
        }
      };

      return descriptor;
    };
  }

  /**
   * 包装异步函数，自动处理错误
   * @param {Function} fn - 异步函数
   * @param {string} context - 错误上下文
   * @returns {Function} 包装后的函数
   */
  static wrapAsync(fn, context) {
    return async function(...args) {
      try {
        return await fn.apply(this, args);
      } catch (error) {
        ErrorHandler.handle(error, context);
        throw error;
      }
    };
  }

  /**
   * 发送错误到追踪服务（可选）
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   */
  static sendToErrorTracking(error, context) {
    // 示例：集成Sentry
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.withScope((scope) => {
    //     scope.setExtra('context', context);
    //     Sentry.captureException(error);
    //   });
    // }

    // 示例：发送到自定义服务器
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     message: error.message,
    //     stack: error.stack,
    //     context: context,
    //     url: window.location.href,
    //     userAgent: navigator.userAgent,
    //     timestamp: new Date().toISOString()
    //   })
    // }).catch(err => logger.error('Failed to send error:', err));
  }

  /**
   * 设置全局错误处理器
   */
  static setupGlobalHandlers() {
    // 捕获未处理的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('[UnhandledPromiseRejection]', event.reason);
      event.preventDefault();

      // 向用户显示友好的错误消息
      if (window.app) {
        const message = this.getUserMessage(event.reason);
        window.app.showError('未预期的错误', message);
      }
    });

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      logger.error('[GlobalError]', event.error || event.message);

      // 不显示全局错误给用户（避免干扰）
      // 只记录日志
    });
  }
}

// 自动设置全局错误处理器
if (typeof window !== 'undefined') {
  window.ErrorHandler = ErrorHandler;
  ErrorHandler.setupGlobalHandlers();
}
