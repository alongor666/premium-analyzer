/**
 * 日期排序工具
 * 提供月份、季度等时间维度的自然排序功能
 */

/**
 * 日期自然排序（支持完整日期格式）
 * 支持格式：'2025-01-01', '2025/01/01'等
 * @param {Array} data - 数据数组，包含dimension字段
 * @returns {Array} 排序后的数据
 */
function sortByDate(data) {
  if (!data || data.length === 0) {
    return data;
  }

  const sortedData = [...data];

  sortedData.sort((a, b) => {
    const dateA = parseDate(a.dimension);
    const dateB = parseDate(b.dimension);
    return dateA - dateB;
  });

  return sortedData;
}

/**
 * 解析日期字符串为时间戳
 * 支持格式：
 * - '2025-01-01' -> Date对象
 * - '2025/01/01' -> Date对象
 */
function parseDate(dateStr) {
  if (!dateStr) return 0;

  const str = String(dateStr).trim();

  // 尝试解析为Date对象
  const date = new Date(str);

  // 验证日期有效性
  if (!isNaN(date.getTime())) {
    return date.getTime();
  }

  // 无法解析，返回0
  console.warn('[DateSorter] 无法解析日期:', dateStr);
  return 0;
}

/**
 * 月份自然排序（考虑年份）
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
    const { year: yearA, month: monthA } = parseMonthWithYear(a.dimension);
    const { year: yearB, month: monthB } = parseMonthWithYear(b.dimension);

    // 先比较年份，再比较月份
    if (yearA !== yearB) {
      return yearA - yearB;
    }
    return monthA - monthB;
  });

  return sortedData;
}

/**
 * 解析月份字符串（包含年份信息）
 * @returns {Object} { year: 年份, month: 月份 }
 */
function parseMonthWithYear(monthStr) {
  if (!monthStr) return { year: 0, month: 0 };

  const str = String(monthStr).trim();

  // 格式1: YYYY-MM
  const isoMatch = str.match(/(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10)
    };
  }

  // 其他格式没有年份信息，返回默认年份
  const month = parseMonth(str);
  return { year: 2025, month };  // 默认年份
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
 * @param {string} type - 时间类型 ('date' | 'month' | 'quarter' | 'year' | 'auto')
 * @returns {Array} 排序后的数据
 */
function sortByTime(data, type = 'auto') {
  if (!data || data.length === 0) {
    return data;
  }

  if (type === 'auto') {
    // 自动检测类型
    const sample = data[0]?.dimension || '';

    // 优先检测完整日期格式 (YYYY-MM-DD)
    if (/\d{4}-\d{2}-\d{2}/.test(sample) || /\d{4}\/\d{2}\/\d{2}/.test(sample)) {
      type = 'date';
    }
    // 月份格式 (YYYY-MM 或 N月)
    else if (/\d{4}-\d{2}/.test(sample) || /\d{1,2}月/.test(sample)) {
      type = 'month';
    }
    // 季度格式
    else if (/Q\d/i.test(sample) || /季度/.test(sample)) {
      type = 'quarter';
    }
    // 年份格式
    else if (/^\d{4}$/.test(sample)) {
      type = 'year';
    }
  }

  switch(type) {
    case 'date':
      return sortByDate(data);
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
    sortByDate,
    sortByMonth,
    sortByQuarter,
    sortByYear,
    sortByTime,
    parseDate,
    parseMonth,
    parseMonthWithYear,
    parseQuarter
  };
}
