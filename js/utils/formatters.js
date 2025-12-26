/**
 * 数值和格式化工具函数
 */

/**
 * 格式化数字
 * @param {number} value - 数值
 * @param {string} format - 格式（'0,0.00' | '0,0' | '0.0%'）
 * @returns {string} 格式化后的字符串
 */
function formatNumber(value, format = '0,0.00') {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.00';

  if (format === '0,0.00') {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  if (format === '0,0.0') {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }

  if (format === '0,0') {
    return num.toLocaleString('zh-CN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }

  if (format === '0.0%') {
    return (num * 100).toFixed(1) + '%';
  }

  if (format === '0.00%') {
    return (num * 100).toFixed(2) + '%';
  }

  return num.toString();
}

/**
 * 格式化保费（万元）
 * @param {number} value - 保费数值
 * @returns {string} 格式化后的字符串
 */
function formatPremium(value) {
  return formatNumber(value, '0,0.00') + ' 万元';
}

/**
 * 格式化占比
 * @param {number} ratio - 占比（0-1）
 * @returns {string} 格式化后的字符串
 */
function formatRatio(ratio) {
  return formatNumber(ratio, '0.00%');
}

/**
 * 格式化大数（带单位）
 * @param {number} value - 数值
 * @returns {string} 格式化后的字符串
 */
function formatLargeNumber(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0';

  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万';
  }

  if (num >= 1000) {
    return (num / 1000).toFixed(2) + '千';
  }

  return num.toFixed(2);
}

/**
 * 格式化日期
 * @param {string|Date} date - 日期
 * @param {string} format - 格式（'YYYY-MM-DD' | 'YYYY-MM' | 'MM/DD'）
 * @returns {string} 格式化后的字符串
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (format === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }

  if (format === 'YYYY-MM') {
    return `${year}-${month}`;
  }

  if (format === 'MM/DD') {
    return `${month}/${day}`;
  }

  return date.toString();
}

/**
 * 截断字符串
 * @param {string} str - 字符串
 * @param {number} maxLength - 最大长度
 * @param {string} suffix - 后缀
 * @returns {string} 截断后的字符串
 */
function truncate(str, maxLength = 10, suffix = '...') {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + suffix;
}

/**
 * 防抖函数
 * @param {Function} func - 函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, delay = 300) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * 节流函数
 * @param {Function} func - 函数
 * @param {number} interval - 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, interval = 300) {
  let lastTime = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      func.apply(this, args);
    }
  };
}

// 挂载到window
if (typeof window !== 'undefined') {
  window.formatNumber = formatNumber;
  window.formatPremium = formatPremium;
  window.formatRatio = formatRatio;
  window.formatLargeNumber = formatLargeNumber;
  window.formatDate = formatDate;
  window.truncate = truncate;
  window.debounce = debounce;
  window.throttle = throttle;
}
