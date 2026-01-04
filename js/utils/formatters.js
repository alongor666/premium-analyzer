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

function getPremiumUnitConfig() {
  const fallback = { label: '万元', divisor: 1 };
  if (typeof window === 'undefined' || !window.StateManager?.getState) {
    return fallback;
  }
  const unit = window.StateManager.getState('premiumUnit');
  if (!unit || !unit.label) {
    return fallback;
  }
  const divisor = typeof unit.divisor === 'number' && !isNaN(unit.divisor) ? unit.divisor : 1;
  return { label: unit.label, divisor };
}

/**
 * 格式化保费（动态单位）
 * @param {number} value - 保费数值
 * @param {string} format - 数值格式（默认'0,0'）
 * @returns {string} 格式化后的字符串
 */
function formatPremium(value, format = '0,0') {
  const { label, divisor } = getPremiumUnitConfig();
  const displayValue = divisor ? value / divisor : value;
  return formatNumber(displayValue, format) + ' ' + label;
}

/**
 * 获取保费单位标签
 * @returns {string} 单位标签
 */
function getPremiumUnitLabel() {
  return getPremiumUnitConfig().label;
}

/**
 * 获取保费轴标题
 * @param {string} prefix - 前缀文本
 * @returns {string} 轴标题
 */
function getPremiumAxisLabel(prefix = '保费收入') {
  const label = getPremiumUnitLabel();
  return `${prefix}(${label})`;
}

/**
 * 获取保费表头标题
 * @param {string} prefix - 前缀文本
 * @returns {string} 表头标题
 */
function getPremiumHeaderLabel(prefix = '保费收入') {
  const label = getPremiumUnitLabel();
  return `${prefix}（${label}）`;
}

/**
 * 保费数字格式化（不带分组，便于导出）
 * @param {number} value - 保费数值
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的字符串
 */
function formatPremiumNumber(value, decimals = 2) {
  const { divisor } = getPremiumUnitConfig();
  const displayValue = divisor ? value / divisor : value;
  const num = Number(displayValue);
  if (isNaN(num)) return (0).toFixed(decimals);
  return num.toFixed(decimals);
}

/**
 * 格式化占比 - 1位小数
 * @param {number} ratio - 占比（0-100 或 0-1）
 * @param {boolean} isPercentage - 是否已是百分比数值（默认false，即0-1范围）
 * @returns {string} 格式化后的字符串
 */
function formatRatio(ratio, isPercentage = false) {
  const num = parseFloat(ratio);
  if (isNaN(num)) return '0.0%';

  // 如果已经是百分比数值（0-100），直接格式化
  if (isPercentage) {
    return num.toFixed(1) + '%';
  }

  // 否则先乘以100
  return (num * 100).toFixed(1) + '%';
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
  window.getPremiumUnitLabel = getPremiumUnitLabel;
  window.getPremiumAxisLabel = getPremiumAxisLabel;
  window.getPremiumHeaderLabel = getPremiumHeaderLabel;
  window.formatPremiumNumber = formatPremiumNumber;
  window.formatRatio = formatRatio;
  window.formatLargeNumber = formatLargeNumber;
  window.formatDate = formatDate;
  window.truncate = truncate;
  window.debounce = debounce;
  window.throttle = throttle;
}
