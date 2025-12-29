/**
 * 安全工具类
 * 提供HTML转义和输入验证功能，防止XSS攻击
 */

/**
 * HTML实体转义，防止XSS攻击
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的安全字符串
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) {
    return '';
  }

  // 转换为字符串
  const string = String(str);

  // 转义HTML特殊字符
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 转义HTML属性值
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的安全字符串
 */
export function escapeHtmlAttribute(str) {
  if (str === null || str === undefined) {
    return '';
  }

  const string = String(str);

  // 属性值需要转义引号和特殊字符
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\//g, '&#x2F;');
}

/**
 * 安全地创建DOM元素并设置文本内容
 * @param {string} tag - HTML标签名
 * @param {string} text - 文本内容（会自动转义）
 * @param {Object} attributes - HTML属性对象
 * @returns {HTMLElement} 创建的DOM元素
 */
export function createElementSafe(tag, text, attributes = {}) {
  const element = document.createElement(tag);

  // 设置文本内容（自动转义，防止XSS）
  if (text !== null && text !== undefined) {
    element.textContent = text;
  }

  // 设置属性
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, String(value));
    } else {
      element[key] = value;
    }
  });

  return element;
}

/**
 * 验证并清理数字输入
 * @param {*} value - 输入值
 * @param {Object} options - 验证选项
 * @returns {number|null} 清理后的数字或null
 */
export function sanitizeNumber(value, options = {}) {
  const { min, max, defaultVal = 0 } = options;

  const num = parseFloat(value);

  if (isNaN(num)) {
    return defaultVal;
  }

  if (min !== undefined && num < min) {
    return min;
  }

  if (max !== undefined && num > max) {
    return max;
  }

  return num;
}

/**
 * 验证字符串长度
 * @param {string} str - 输入字符串
 * @param {Object} options - 验证选项
 * @returns {string} 清理后的字符串
 */
export function sanitizeString(str, options = {}) {
  const { maxLength = 1000, trim = true } = options;

  if (str === null || str === undefined) {
    return '';
  }

  let result = String(str);

  if (trim) {
    result = result.trim();
  }

  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
}

/**
 * 批量转义对象中的所有字符串值
 * @param {Object} obj - 需要转义的对象
 * @returns {Object} 转义后的新对象
 */
export function escapeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => escapeObject(item));
  }

  if (typeof obj === 'object') {
    const result = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result[key] = escapeHtml(value);
      } else if (typeof value === 'object') {
        result[key] = escapeObject(value);
      } else {
        result[key] = value;
      }
    });
    return result;
  }

  return obj;
}

// 挂载到window供全局使用
if (typeof window !== 'undefined') {
  window.SecurityUtils = {
    escapeHtml,
    escapeHtmlAttribute,
    createElementSafe,
    sanitizeNumber,
    sanitizeString,
    escapeObject
  };
}
