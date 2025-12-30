/**
 * 日期排序工具
 * 提供月份、季度等时间维度的自然排序功能
 */

/**
 * 月份自然排序
 * 支持格式：'2025-01', '1月', 'Jan', '01'等
 * @param {Array} data - 数据数组，包含dimension字段
 * @returns {Array} 排序后的数据
 */
function sortByMonth(data) {
  if (!data || data.length === 0) {
    return data;
  }

  // 克隆数据避免修改原数组
  const sortedData = [...data];

  sortedData.sort((a, b) => {
    const monthA = parseMonth(a.dimension);
    const monthB = parseMonth(b.dimension);
    return monthA - monthB;
  });

  return sortedData;
}

/**
 * 解析月份字符串，提取月份数字
 * 支持格式：
 * - '2025-01' -> 1
 * - '1月' -> 1
 * - 'Jan' -> 1
 * - '01' -> 1
 * - '十一月' -> 11
 */
function parseMonth(monthStr) {
  if (!monthStr) return 0;

  const str = String(monthStr).trim();

  // 格式1: YYYY-MM
  const isoMatch = str.match(/\d{4}-(\d{1,2})/);
  if (isoMatch) {
    return parseInt(isoMatch[1], 10);
  }

  // 格式2: N月 (中文)
  const cnMatch = str.match(/(\d{1,2})月/);
  if (cnMatch) {
    return parseInt(cnMatch[1], 10);
  }

  // 格式3: 英文月份
  const enMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const enIndex = enMonths.indexOf(str.toLowerCase().slice(0, 3));
  if (enIndex !== -1) {
    return enIndex + 1;
  }

  // 格式4: 中文月份
  const cnMonths = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const cnIndex = cnMonths.indexOf(str);
  if (cnIndex !== -1) {
    return cnIndex + 1;
  }

  // 格式5: 纯数字 (01, 1, 11)
  const numMatch = str.match(/^(\d{1,2})$/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }

  // 无法解析，返回0
  console.warn('[DateSorter] 无法解析月份:', monthStr);
  return 0;
}

/**
 * 季度自然排序
 * 支持格式：'2025-Q1', 'Q1', '第一季度'等
 * @param {Array} data - 数据数组
 * @returns {Array} 排序后的数据
 */
function sortByQuarter(data) {
  if (!data || data.length === 0) {
    return data;
  }

  const sortedData = [...data];

  sortedData.sort((a, b) => {
    const quarterA = parseQuarter(a.dimension);
    const quarterB = parseQuarter(b.dimension);
    return quarterA - quarterB;
  });

  return sortedData;
}

/**
 * 解析季度字符串
 */
function parseQuarter(quarterStr) {
  if (!quarterStr) return 0;

  const str = String(quarterStr).trim();

  // Q1, Q2, Q3, Q4
  const qMatch = str.match(/Q(\d)/i);
  if (qMatch) {
    return parseInt(qMatch[1], 10);
  }

  // 第N季度
  const cnMatch = str.match(/第([一二三四])季度/);
  if (cnMatch) {
    const cnNums = { '一': 1, '二': 2, '三': 3, '四': 4 };
    return cnNums[cnMatch[1]] || 0;
  }

  return 0;
}

/**
 * 年份自然排序
 * @param {Array} data - 数据数组
 * @returns {Array} 排序后的数据
 */
function sortByYear(data) {
  if (!data || data.length === 0) {
    return data;
  }

  const sortedData = [...data];

  sortedData.sort((a, b) => {
    const yearA = parseInt(a.dimension, 10) || 0;
    const yearB = parseInt(b.dimension, 10) || 0;
    return yearA - yearB;
  });

  return sortedData;
}

/**
 * 通用时间排序（自动识别类型）
 * @param {Array} data - 数据数组
 * @param {string} type - 时间类型 ('month' | 'quarter' | 'year' | 'auto')
 * @returns {Array} 排序后的数据
 */
function sortByTime(data, type = 'auto') {
  if (!data || data.length === 0) {
    return data;
  }

  if (type === 'auto') {
    // 自动检测类型
    const sample = data[0]?.dimension || '';
    if (/\d{4}-\d{2}/.test(sample) || /\d{1,2}月/.test(sample)) {
      type = 'month';
    } else if (/Q\d/i.test(sample) || /季度/.test(sample)) {
      type = 'quarter';
    } else if (/^\d{4}$/.test(sample)) {
      type = 'year';
    }
  }

  switch(type) {
    case 'month':
      return sortByMonth(data);
    case 'quarter':
      return sortByQuarter(data);
    case 'year':
      return sortByYear(data);
    default:
      return data;
  }
}

// 导出
if (typeof window !== 'undefined') {
  window.DateSorter = {
    sortByMonth,
    sortByQuarter,
    sortByYear,
    sortByTime,
    parseMonth,
    parseQuarter
  };
}
