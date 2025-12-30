/**
 * 数据处理工具
 * 提供贡献度计算、数据聚合等可复用功能
 */

/**
 * 计算保费贡献度
 * 贡献度 = 该项保费收入 / 总保费收入 * 100
 *
 * @param {Array} data - 数据数组 [{dimension, premium}, ...]
 * @param {Object} options - 可选配置
 * @param {string} options.groupField - 分组字段（用于计算每组内的贡献度）
 * @param {boolean} options.asPercentage - 是否返回百分比（默认true）
 * @returns {Array} 添加了contribution字段的数据
 *
 * @example
 * // 单独计算每项贡献度
 * const data = [
 *   { dimension: '1月', premium: 100 },
 *   { dimension: '2月', premium: 200 }
 * ];
 * calculateContribution(data);
 * // => [
 * //   { dimension: '1月', premium: 100, contribution: 33.33 },
 * //   { dimension: '2月', premium: 200, contribution: 66.67 }
 * // ]
 *
 * @example
 * // 按分组计算贡献度（如按月份）
 * const data = [
 *   { month: '1月', org: 'A', premium: 100 },
 *   { month: '1月', org: 'B', premium: 200 },
 *   { month: '2月', org: 'A', premium: 150 }
 * ];
 * calculateContribution(data, { groupField: 'month' });
 * // => [
 * //   { month: '1月', org: 'A', premium: 100, contribution: 33.33 },
 * //   { month: '1月', org: 'B', premium: 200, contribution: 66.67 },
 * //   { month: '2月', org: 'A', premium: 150, contribution: 100 }
 * // ]
 */
function calculateContribution(data, options = {}) {
  if (!data || data.length === 0) {
    return data;
  }

  const { groupField = null, asPercentage = true } = options;

  // 克隆数据
  const processedData = data.map(item => ({ ...item }));

  if (groupField) {
    // 按分组计算贡献度
    // 1. 计算每组的总保费
    const groupTotals = {};
    processedData.forEach(item => {
      const group = item[groupField];
      if (!groupTotals[group]) {
        groupTotals[group] = 0;
      }
      groupTotals[group] += item.premium || 0;
    });

    // 2. 计算每项在组内的贡献度
    processedData.forEach(item => {
      const group = item[groupField];
      const total = groupTotals[group];
      const contribution = total > 0 ? (item.premium || 0) / total : 0;
      item.contribution = asPercentage ? contribution * 100 : contribution;
    });

  } else {
    // 全局贡献度
    const totalPremium = processedData.reduce((sum, item) => sum + (item.premium || 0), 0);

    processedData.forEach(item => {
      const contribution = totalPremium > 0 ? (item.premium || 0) / totalPremium : 0;
      item.contribution = asPercentage ? contribution * 100 : contribution;
    });
  }

  return processedData;
}

/**
 * 计算时间序列的贡献度
 * 专用于时间维度数据（月、季、年），计算每个时间点相对于整体的贡献度
 *
 * @param {Array} data - 时间序列数据 [{dimension, premium}, ...]
 * @returns {Array} 添加了contribution字段的数据
 *
 * @example
 * const monthlyData = [
 *   { dimension: '2025-01', premium: 1000 },
 *   { dimension: '2025-02', premium: 1500 },
 *   { dimension: '2025-03', premium: 2000 }
 * ];
 * calculateTimeSeriesContribution(monthlyData);
 * // => [
 * //   { dimension: '2025-01', premium: 1000, contribution: 22.22 },
 * //   { dimension: '2025-02', premium: 1500, contribution: 33.33 },
 * //   { dimension: '2025-03', premium: 2000, contribution: 44.44 }
 * // ]
 */
function calculateTimeSeriesContribution(data) {
  return calculateContribution(data, { asPercentage: true });
}

/**
 * 计算占年度保费比（Annual Contribution Ratio）
 * 计算每个月份的保费占全年总保费的比例
 *
 * @param {Array} data - 月度数据 [{dimension, premium}, ...]
 * @returns {Array} 添加了annualRatio字段的数据
 *
 * @example
 * // 筛选条件：客户类别=摩托车
 * const motorcycleData = [
 *   { dimension: '2025-01', premium: 100 },  // 1月摩托车保费
 *   { dimension: '2025-02', premium: 150 },  // 2月摩托车保费
 *   { dimension: '2025-03', premium: 200 }   // 3月摩托车保费
 * ];
 * calculateAnnualRatio(motorcycleData);
 * // => [
 * //   { dimension: '2025-01', premium: 100, annualRatio: 22.22 },  // 100/450
 * //   { dimension: '2025-02', premium: 150, annualRatio: 33.33 },  // 150/450
 * //   { dimension: '2025-03', premium: 200, annualRatio: 44.44 }   // 200/450
 * // ]
 */
function calculateAnnualRatio(data) {
  if (!data || data.length === 0) {
    return data;
  }

  const processedData = data.map(item => ({ ...item }));

  // 计算全年总保费
  const totalAnnualPremium = processedData.reduce((sum, item) => sum + (item.premium || 0), 0);

  // 计算每月占年度保费比
  processedData.forEach(item => {
    const ratio = totalAnnualPremium > 0 ? (item.premium || 0) / totalAnnualPremium : 0;
    item.annualRatio = ratio * 100;  // 转为百分比
  });

  return processedData;
}

/**
 * 计算占当月车险比（Monthly Share Ratio）
 * 需要原始数据来计算每月的总保费，然后计算占比
 *
 * @param {Array} filteredData - 筛选后的月度数据 [{dimension, premium}, ...]
 * @param {Array} totalData - 当月总数据（用于计算分母）[{dimension, premium}, ...]
 * @returns {Array} 添加了monthlyRatio字段的数据
 *
 * @example
 * // 筛选条件：客户类别=摩托车
 * const motorcycleData = [
 *   { dimension: '2025-01', premium: 100 },  // 1月摩托车保费
 *   { dimension: '2025-02', premium: 150 }   // 2月摩托车保费
 * ];
 *
 * // 当月车险总保费（所有类别）
 * const totalData = [
 *   { dimension: '2025-01', premium: 500 },  // 1月总保费
 *   { dimension: '2025-02', premium: 600 }   // 2月总保费
 * ];
 *
 * calculateMonthlyRatio(motorcycleData, totalData);
 * // => [
 * //   { dimension: '2025-01', premium: 100, monthlyRatio: 20.0 },  // 100/500
 * //   { dimension: '2025-02', premium: 150, monthlyRatio: 25.0 }   // 150/600
 * // ]
 */
function calculateMonthlyRatio(filteredData, totalData) {
  if (!filteredData || filteredData.length === 0) {
    return filteredData;
  }

  const processedData = filteredData.map(item => ({ ...item }));

  // 构建月度总保费映射
  const monthlyTotals = {};
  (totalData || []).forEach(item => {
    monthlyTotals[item.dimension] = item.premium || 0;
  });

  // 计算每月占当月车险比
  processedData.forEach(item => {
    const monthTotal = monthlyTotals[item.dimension] || 0;
    const ratio = monthTotal > 0 ? (item.premium || 0) / monthTotal : 0;
    item.monthlyRatio = ratio * 100;  // 转为百分比
  });

  return processedData;
}

/**
 * 计算同比/环比增长
 * @param {Array} data - 时间序列数据（需已排序）
 * @param {string} type - 'yoy' (同比) | 'mom' (环比)
 * @returns {Array} 添加了growth字段的数据
 */
function calculateGrowth(data, type = 'mom') {
  if (!data || data.length === 0) {
    return data;
  }

  const processedData = data.map(item => ({ ...item }));

  processedData.forEach((item, index) => {
    if (type === 'mom' && index > 0) {
      // 环比：与上一期对比
      const prevPremium = processedData[index - 1].premium || 0;
      if (prevPremium > 0) {
        item.growth = ((item.premium || 0) - prevPremium) / prevPremium * 100;
      } else {
        item.growth = 0;
      }
    } else if (type === 'yoy' && index >= 12) {
      // 同比：与去年同期对比（假设是月度数据）
      const lastYearPremium = processedData[index - 12].premium || 0;
      if (lastYearPremium > 0) {
        item.growth = ((item.premium || 0) - lastYearPremium) / lastYearPremium * 100;
      } else {
        item.growth = 0;
      }
    } else {
      item.growth = 0; // 第一期或数据不足
    }
  });

  return processedData;
}

/**
 * 聚合数据（按指定字段分组求和）
 * @param {Array} rawData - 原始数据
 * @param {string} groupBy - 分组字段名
 * @returns {Array} 聚合后的数据
 */
function aggregateData(rawData, groupBy) {
  if (!rawData || rawData.length === 0) {
    return [];
  }

  const grouped = {};

  rawData.forEach(row => {
    const key = row[groupBy];
    if (!key) return;

    if (!grouped[key]) {
      grouped[key] = {
        dimension: key,
        premium: 0,
        count: 0
      };
    }

    grouped[key].premium += row.premium || 0;
    grouped[key].count += 1;
  });

  return Object.values(grouped);
}

/**
 * TOP N 数据提取
 * @param {Array} data - 数据数组
 * @param {number} n - 提取前N项
 * @param {string} sortField - 排序字段（默认premium）
 * @returns {Object} { topN, others }
 */
function extractTopN(data, n = 10, sortField = 'premium') {
  if (!data || data.length === 0) {
    return { topN: [], others: null };
  }

  // 排序
  const sorted = [...data].sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

  if (sorted.length <= n) {
    return { topN: sorted, others: null };
  }

  const topN = sorted.slice(0, n);
  const othersData = sorted.slice(n);
  const othersPremium = othersData.reduce((sum, item) => sum + (item.premium || 0), 0);
  const othersCount = othersData.reduce((sum, item) => sum + (item.count || 1), 0);

  const others = {
    dimension: '其他',
    premium: othersPremium,
    count: othersCount,
    isOthers: true
  };

  return { topN, others };
}

// 导出
if (typeof window !== 'undefined') {
  window.DataProcessor = {
    calculateContribution,
    calculateTimeSeriesContribution,
    calculateAnnualRatio,
    calculateMonthlyRatio,
    calculateGrowth,
    aggregateData,
    extractTopN
  };
}
