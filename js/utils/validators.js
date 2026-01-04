/**
 * 数据验证工具函数
 */

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {Array<string>} allowedTypes - 允许的类型
 * @returns {boolean} 是否有效
 */
function validateFileType(file, allowedTypes = ['.csv', '.xlsx', '.xls']) {
  if (!file) return false;

  const fileName = file.name.toLowerCase();
  return allowedTypes.some(ext => fileName.endsWith(ext));
}

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSize - 最大大小（字节）
 * @returns {boolean} 是否有效
 */
function validateFileSize(file, maxSize = 200 * 1024 * 1024) {
  if (!file) return false;
  return file.size <= maxSize;
}

/**
 * 验证必填字段
 * @param {Object} data - 数据对象
 * @param {Array<string>} requiredFields - 必填字段列表
 * @returns {Object} { valid: boolean, missing: Array<string> }
 */
function validateRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter(field => {
    return !data || data[field] === null || data[field] === undefined || data[field] === '';
  });

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * 验证数值范围
 * @param {number} value - 数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} 是否在范围内
 */
function validateNumberRange(value, min = -Infinity, max = Infinity) {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  return num >= min && num <= max;
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 验证数据完整性
 * @param {Array} data - 数据数组
 * @param {Array<string>} criticalFields - 关键字段
 * @returns {Object} { valid: boolean, issues: Array }
 */
function validateDataIntegrity(data, criticalFields) {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      valid: false,
      issues: ['数据为空']
    };
  }

  const issues = [];

  // 检查关键字段是否存在
  criticalFields.forEach(field => {
    const hasField = data[0].hasOwnProperty(field);
    if (!hasField) {
      issues.push(`缺少关键字段: ${field}`);
    }
  });

  // 检查空值率
  criticalFields.forEach(field => {
    if (data[0].hasOwnProperty(field)) {
      const nullCount = data.filter(row => !row[field]).length;
      const nullRate = nullCount / data.length;

      if (nullRate > 0.5) {
        issues.push(`字段 ${field} 空值率过高 (${(nullRate * 100).toFixed(1)}%)`);
      }
    }
  });

  return {
    valid: issues.length === 0,
    issues
  };
}

// 挂载到window
if (typeof window !== 'undefined') {
  window.validateFileType = validateFileType;
  window.validateFileSize = validateFileSize;
  window.validateRequiredFields = validateRequiredFields;
  window.validateNumberRange = validateNumberRange;
  window.validateEmail = validateEmail;
  window.validateDataIntegrity = validateDataIntegrity;
}
