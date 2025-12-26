/**
 * 日志管理器
 * 在开发环境输出日志，在生产环境禁用
 */
const isDevelopment = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '' ||
                      window.location.protocol === 'file:';

const logger = {
  /**
   * 输出普通日志（仅开发环境）
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * 输出警告日志（仅开发环境）
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * 输出错误日志（始终显示）
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * 输出信息日志（仅开发环境）
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * 输出调试日志（仅开发环境）
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * 分组日志（仅开发环境）
   */
  group: (label) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * 结束分组（仅开发环境）
   */
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * 表格形式输出（仅开发环境）
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  },

  /**
   * 计时开始（仅开发环境）
   */
  time: (label) => {
    if (isDevelopment) {
      console.time(label);
    }
  },

  /**
   * 计时结束（仅开发环境）
   */
  timeEnd: (label) => {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  },

  /**
   * 追踪调用栈（仅开发环境）
   */
  trace: (...args) => {
    if (isDevelopment) {
      console.trace(...args);
    }
  },

  /**
   * 检查是否为开发环境
   */
  isDev: () => {
    return isDevelopment;
  }
};

// 挂载到window
if (typeof window !== 'undefined') {
  window.logger = logger;
}
