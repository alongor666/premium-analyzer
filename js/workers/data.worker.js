/**
 * 数据处理Worker
 * 参考：autowrKPI/js/workers/data.worker.js
 * 负责文件解析、数据聚合、筛选计算
 */

// 引入第三方库
importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
  'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js'
);

// 全局变量
let rawData = null;           // 原始数据缓存
let fieldMap = {};            // 字段映射
let dimensionConfig = null;   // 维度配置
let lastFilterKey = null;     // 上次筛选条件hash
let lastResult = null;        // 上次结果缓存
let premiumUnit = { label: '万元', divisor: 1 }; // 保费单位（基于源数据字段名识别）

/**
 * 消息处理器
 */
self.addEventListener('message', async (e) => {
  const { type, payload, requestId } = e.data;

  try {
    let result;

    switch(type) {
      case 'PARSE_FILE':
        result = await parseFile(payload);
        break;

      case 'APPLY_FILTER':
        result = applyFilterAndAggregate(payload);
        break;

      case 'EXPORT_DATA':
        result = exportData(payload);
        break;

      default:
        throw new Error(`未知消息类型: ${type}`);
    }

    // 返回成功响应
    self.postMessage({
      type: type + '_COMPLETE',
      requestId,
      payload: {
        success: true,
        data: result
      }
    });

  } catch (error) {
    console.error(`[Worker] 处理失败 (${type}):`, error);

    // 返回错误响应
    self.postMessage({
      type: 'ERROR',
      requestId,
      payload: {
        success: false,
        error: error.message
      }
    });
  }
});

/**
 * 智能字段匹配器
 * 支持: 精确匹配、包含匹配、语义映射、模糊匹配
 */
class FieldMatcher {
  constructor() {
    // 语义映射表
    this.semanticMap = {
      // 时间维度映射
      '日期': ['start_date'],
      '年月': ['start_month'],
      '月份': ['start_month'],
      '星期': ['week_day'],
      '是否周末': ['is_weekend'],
      // 业务维度映射
      '险别': ['coverage_type', 'insurance_type'],
      '险类': ['insurance_type'],
      '是否新能源': ['energy_type'],
      '是否新旧车': ['is_transferred_vehicle']
    };
  }

  /**
   * 计算CSV字段与配置维度的匹配分数 (0-1)
   */
  calculateMatchScore(csvField, dimension) {
    const normalized = this.normalize(csvField);

    // 1. 精确匹配 csvFields数组
    if (dimension.csvFields.some(f =>
      this.normalize(f) === normalized
    )) {
      return 1.0;
    }

    // 2. 包含匹配
    for (const cf of dimension.csvFields.map(f => this.normalize(f))) {
      if (normalized.includes(cf)) return 0.9;
      if (cf.includes(normalized)) return 0.8;
    }

    // 3. 语义映射
    const mappedKeys = this.semanticMap[csvField] || [];
    if (mappedKeys.includes(dimension.key)) {
      return 0.75;
    }

    // 4. 标签相似度
    const labelSim = this.stringSimilarity(
      normalized,
      this.normalize(dimension.label)
    );
    if (labelSim > 0.7) return 0.6 + labelSim * 0.1;

    return 0;
  }

  normalize(str) {
    return String(str).replace(/\s+/g, '').toLowerCase();
  }

  stringSimilarity(a, b) {
    // Jaro-Winkler 简化版
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1.0;

    let matches = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] === b[i]) matches++;
    }
    return matches / maxLen;
  }
}

/**
 * 动态维度检测器
 * 识别CSV中未配置的文本字段作为维度
 */
class DynamicDimensionDetector {
  constructor(configDimensions, metricConfig) {
    this.configKeys = new Set(configDimensions.map(d => d.key));
    this.metricFields = metricConfig.csvFields;

    // 排除字段模式
    this.excludePatterns = [
      /^id$/i, /^序号$/, /^index$/i,
      /备注/, /说明/, /remark/i,
      /日期时间戳/, /timestamp/i
    ];
  }

  /**
   * 检测动态维度
   */
  detect(csvFields, sampleData, fieldMap) {
    const dynamicDimensions = [];
    const mappedFields = new Set(Object.values(fieldMap));

    for (const field of csvFields) {
      // 跳过已映射和排除字段
      if (mappedFields.has(field) || this.shouldExclude(field)) {
        continue;
      }

      // 分析字段类型
      const fieldType = this.analyzeFieldType(field, sampleData);

      if (fieldType.isDimension) {
        dynamicDimensions.push(
          this.createDimensionConfig(field, fieldType, dynamicDimensions.length)
        );
      }
    }

    console.log(`[DynamicDetector] 检测到${dynamicDimensions.length}个动态维度:`,
      dynamicDimensions.map(d => d.label).join(', '));

    return dynamicDimensions;
  }

  /**
   * 分析字段类型
   */
  analyzeFieldType(field, sampleData) {
    const values = sampleData.map(row => row[field]).filter(v => v != null);
    const uniqueValues = new Set(values);
    const uniqueRatio = uniqueValues.size / values.length;

    // 数据类型统计
    let stringCount = 0, numberCount = 0;
    for (const v of values) {
      if (typeof v === 'number' || !isNaN(parseFloat(v))) {
        numberCount++;
      } else {
        stringCount++;
      }
    }

    // 检测是否为时间字段
    const isTimeField = this.isTimeField(field, values);

    const stats = {
      total: values.length,
      unique: uniqueValues.size,
      uniqueRatio,
      stringRatio: stringCount / values.length,
      numberRatio: numberCount / values.length,
      isTimeField
    };

    // 判定规则
    const isDimension = this.isDimensionField(stats);

    return { isDimension, stats, fieldName: field };
  }

  /**
   * 检测是否为时间字段
   */
  isTimeField(fieldName, values) {
    // 字段名包含时间关键词
    const timeKeywords = ['日期', '时间', '年月', '月份', '星期', '周', 'date', 'time', 'month', 'week', 'day'];
    const hasTimeKeyword = timeKeywords.some(kw => fieldName.includes(kw));

    if (!hasTimeKeyword) return false;

    // 检查值格式（至少10%符合日期格式）
    let dateFormatCount = 0;
    const sampleSize = Math.min(20, values.length);
    const datePatterns = [
      /^\d{4}-\d{1,2}-\d{1,2}$/,  // 2025-01-01
      /^\d{4}-\d{1,2}$/,           // 2025-01
      /^\d{4}\/\d{1,2}\/\d{1,2}$/, // 2025/01/01
      /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i,  // 星期
      /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/i  // 星期缩写
    ];

    for (let i = 0; i < sampleSize; i++) {
      const val = String(values[i]);
      if (datePatterns.some(p => p.test(val))) {
        dateFormatCount++;
      }
    }

    return dateFormatCount / sampleSize > 0.1;
  }

  /**
   * 维度字段判定
   */
  isDimensionField(stats) {
    // 特殊规则: 时间字段放宽限制
    if (stats.isTimeField) {
      // 时间字段只要有2个以上唯一值即可
      // 允许唯一值很多（如日期可能有几十个）
      if (stats.unique >= 2 && stats.unique <= 366) {  // 最多一年的天数
        return true;
      }
    }

    // 规则1: 纯数值 → 可能是度量
    if (stats.numberRatio > 0.9) return false;

    // 规则2: 唯一值过多 → 可能是ID
    if (stats.uniqueRatio > 0.8 && stats.unique > 100) return false;

    // 规则3: 唯一值适中 → 典型维度
    if (stats.unique >= 2 && stats.unique <= 200 && stats.uniqueRatio < 0.5) {
      return true;
    }

    return false;
  }

  shouldExclude(field) {
    return this.excludePatterns.some(p => p.test(field));
  }

  /**
   * 创建动态维度配置
   */
  createDimensionConfig(field, fieldType, index) {
    const colors = [
      '#b4a7d6', '#f4cccc', '#d9ead3', '#fce5cd', '#c9daf8',
      '#d5a6bd', '#ead1dc', '#cfe2f3', '#d9d2e9', '#ffd966'
    ];

    return {
      key: 'dynamic_' + field.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '_'),
      label: field,
      csvFields: [field],
      color: colors[index % colors.length],
      group: 6,
      sortable: true,
      searchable: fieldType.stats.unique < 100,
      isDynamic: true,
      type: 'text'
    };
  }
}

/**
 * 解析文件
 * @param {Object} payload - { fileContent, fileName, fileType, configDimensions, metricConfig }
 */
async function parseFile({ fileContent, fileName, fileType, configDimensions, metricConfig }) {
  console.log('[Worker] 开始解析文件:', fileName, 'type:', fileType);

  // 发送进度
  sendProgress('parsing', 0);

  // 1. 根据文件类型解析
  let parsedData;
  if (fileType === 'csv') {
    parsedData = await parseCSV(fileContent);
  } else {
    parsedData = await parseExcel(fileContent);
  }

  sendProgress('parsing', 50);

  // 2. 数据清洗
  const cleanedData = cleanData(parsedData);
  console.log('[Worker] 数据清洗完成，行数:', cleanedData.length);

  sendProgress('parsing', 70);

  // 3. 智能字段映射 (新函数,需要config参数)
  let mappingResult;
  if (cleanedData.length > 0) {
    // 缓存数据供动态检测使用
    rawData = cleanedData;

    mappingResult = buildSmartFieldMap(
      cleanedData[0],
      configDimensions || [],  // 配置维度
      metricConfig || { csvFields: ['保费收入', '保费', 'premium', '签单保费', '保险费'] }  // 保费配置
    );

    fieldMap = mappingResult.fieldMap;
    premiumUnit = detectPremiumUnit(fieldMap.premium, cleanedData);
  } else {
    throw new Error('文件为空或格式错误');
  }

  sendProgress('parsing', 80);

  // 4. 计算全局统计
  const stats = calculateGlobalStats(cleanedData);

  // 5. 提取维度唯一值
  const dimensions = extractDimensions(cleanedData);

  sendProgress('parsing', 100);

  // 6. 返回结果 (新增字段)
  return {
    total: cleanedData.length,
    premium: stats.totalPremium,
    premiumUnit,
    dimensions,
    monthRange: stats.monthRange,
    fields: Object.keys(cleanedData[0]),

    // 新增字段
    dynamicDimensions: mappingResult.dynamicDimensions,
    unmatchedDimensions: mappingResult.unmatchedDimensions,
    mappingSummary: mappingResult.mappingSummary
  };
}

/**
 * 解析CSV（使用PapaParse）
 */
async function parseCSV(arrayBuffer) {
  return new Promise((resolve, reject) => {
    const decoder = new TextDecoder('utf-8');
    const csvString = decoder.decode(arrayBuffer);

    Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // 不自动转换类型，手动控制
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('[Worker] CSV解析警告:', results.errors);
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(new Error('CSV解析失败: ' + error.message));
      }
    });
  });
}

/**
 * 解析Excel（使用SheetJS）
 */
async function parseExcel(arrayBuffer) {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',  // 空单元格默认值
      raw: false   // 不返回原始值，转换为字符串
    });

    return data;
  } catch (error) {
    throw new Error('Excel解析失败: ' + error.message);
  }
}

/**
 * 数据清洗
 */
function cleanData(data) {
  return data.filter(row => {
    // 过滤完全空的行
    const hasData = Object.values(row).some(v => v !== null && v !== undefined && v !== '');
    return hasData;
  }).map(row => {
    // 清理空格和格式
    const cleaned = {};
    Object.keys(row).forEach(key => {
      let value = row[key];

      // 清理字符串
      if (typeof value === 'string') {
        value = value.trim();
      }

      cleaned[key] = value;
    });
    return cleaned;
  });
}

/**
 * 智能字段映射构建器
 * 替换原buildFieldMap函数
 */
function buildSmartFieldMap(sampleRow, configDimensions, metricConfig) {
  console.log('[Worker] 开始智能字段映射...');

  const csvFields = Object.keys(sampleRow);
  const fieldMatcher = new FieldMatcher();
  const detector = new DynamicDimensionDetector(configDimensions, metricConfig);

  const fieldMap = {};
  const unmatchedDimensions = [];
  const matchedFields = new Set();

  // 1. 匹配保费字段
  for (const candidateField of metricConfig.csvFields) {
    const actualField = csvFields.find(cf =>
      fieldMatcher.normalize(cf) === fieldMatcher.normalize(candidateField)
    );
    if (actualField) {
      fieldMap.premium = actualField;
      matchedFields.add(actualField);
      break;
    }
  }

  if (!fieldMap.premium) {
    throw new Error(`保费字段未找到。CSV字段: ${csvFields.join(', ')}`);
  }

  // 2. 匹配配置维度
  for (const dim of configDimensions) {
    let bestField = null;
    let bestScore = 0;

    // 找最佳匹配CSV字段
    for (const csvField of csvFields) {
      if (matchedFields.has(csvField)) continue;

      const score = fieldMatcher.calculateMatchScore(csvField, dim);
      if (score > bestScore && score >= 0.6) {  // 阈值60分
        bestScore = score;
        bestField = csvField;
      }
    }

    if (bestField) {
      fieldMap[dim.key] = bestField;
      matchedFields.add(bestField);
      console.log(`[Match] ${dim.label} ← ${bestField} (score: ${bestScore.toFixed(2)})`);
    } else {
      unmatchedDimensions.push(dim);
      console.warn(`[Unmatch] ${dim.label}: 无匹配字段`);
    }
  }

  // 3. 检测动态维度
  const dynamicDimensions = detector.detect(
    csvFields,
    rawData.slice(0, Math.min(100, rawData.length)), // 前100行样本
    fieldMap
  );

  // 4. 添加动态维度到fieldMap
  for (const dim of dynamicDimensions) {
    fieldMap[dim.key] = dim.csvFields[0];
  }

  console.log('[Worker] 字段映射完成:', {
    配置维度: Object.keys(fieldMap).length - 1 - dynamicDimensions.length,
    动态维度: dynamicDimensions.length,
    未匹配配置维度: unmatchedDimensions.length
  });

  return {
    fieldMap,
    dynamicDimensions,
    unmatchedDimensions,
    mappingSummary: {
      total: csvFields.length,
      mapped: Object.keys(fieldMap).length,
      unmapped: csvFields.length - Object.keys(fieldMap).length
    }
  };
}

/**
 * 识别保费单位（基于字段名/样本值）
 * @returns {Object} { label: '单位名称', divisor: 转换为万元的除数 }
 */
function detectPremiumUnit(fieldName, data) {
  const normalized = String(fieldName || '').replace(/\s+/g, '');

  // 优先从字段名识别
  if (normalized.includes('万元') || normalized.includes('万')) {
    return { label: '万元', divisor: 1 };  // 已是万元，不需转换
  }
  if (normalized.includes('千元') || normalized.includes('仟元')) {
    return { label: '千元', divisor: 10 };  // 千元转万元：除以10
  }
  if (normalized.includes('元') && !normalized.includes('万') && !normalized.includes('千')) {
    return { label: '元', divisor: 10000 };  // 元转万元：除以10000
  }

  // 如果字段名无法判断，从样本数据推断
  const sample = data.find(row => {
    const value = row?.[fieldMap.premium];
    return typeof value === 'string' && (value.includes('万') || value.includes('元'));
  });

  if (sample) {
    const value = String(sample[fieldMap.premium]);
    if (value.includes('万')) {
      return { label: '万元', divisor: 1 };
    }
    if (value.includes('元') && !value.includes('万')) {
      return { label: '元', divisor: 10000 };
    }
  }

  // 从数值大小推断（如果平均值>1000，可能是元；<100可能是万元）
  const sampleValues = data.slice(0, 100).map(row => {
    const val = row?.[fieldMap.premium];
    return typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
  }).filter(v => !isNaN(v) && v > 0);

  if (sampleValues.length > 0) {
    const avgValue = sampleValues.reduce((sum, v) => sum + v, 0) / sampleValues.length;

    if (avgValue > 1000) {
      console.log(`[Worker] 根据样本数据平均值(${avgValue.toFixed(2)})推断单位为"元"`);
      return { label: '元', divisor: 10000 };
    } else if (avgValue < 100) {
      console.log(`[Worker] 根据样本数据平均值(${avgValue.toFixed(2)})推断单位为"万元"`);
      return { label: '万元', divisor: 1 };
    }
  }

  // 默认：万元
  console.log('[Worker] 无法判断单位，默认使用"万元"');
  return { label: '万元', divisor: 1 };
}

/**
 * 计算全局统计
 */
function calculateGlobalStats(data) {
  const premiumField = fieldMap.premium;

  // 计算总保费
  const totalPremium = data.reduce((sum, row) => {
    return sum + parsePremium(row[premiumField]);
  }, 0);

  // 提取月份范围
  const monthField = fieldMap.start_month;
  let monthRange = [];

  if (monthField) {
    monthRange = [...new Set(data.map(row => row[monthField]))]
      .filter(m => m)
      .sort();
  }

  return {
    totalPremium,
    totalCount: data.length,
    monthRange
  };
}

/**
 * 提取维度唯一值
 */
function extractDimensions(data) {
  const dimensions = {};

  // 遍历所有映射的维度字段
  Object.keys(fieldMap).forEach(key => {
    if (key === 'premium') return; // 跳过保费字段

    const fieldName = fieldMap[key];
    dimensions[key] = [...new Set(data.map(row => row[fieldName]))]
      .filter(v => v !== null && v !== undefined && v !== '')
      .sort();
  });

  console.log('[Worker] 维度唯一值统计:', Object.keys(dimensions).map(k => `${k}: ${dimensions[k].length}个`).join(', '));

  return dimensions;
}

/**
 * 应用筛选并聚合
 */
function applyFilterAndAggregate({ filters, groupBy }) {
  console.log('[Worker] 应用筛选:', filters, '聚合维度:', groupBy);

  // 生成筛选条件hash（用于缓存）
  const filterKey = JSON.stringify({ filters, groupBy });

  // 如果筛选条件未变，直接返回缓存
  if (filterKey === lastFilterKey && lastResult) {
    console.log('[Worker] 使用缓存结果');
    return lastResult;
  }

  sendProgress('filtering', 30);

  // 1. 应用筛选
  const filtered = filterData(rawData, filters);

  sendProgress('filtering', 60);

  // 2. 按维度聚合
  const aggregated = aggregateByDimension(filtered, groupBy);

  sendProgress('filtering', 90);

  // 3. 计算汇总信息
  const filteredPremium = aggregated.reduce((sum, item) => sum + item.premium, 0);
  const totalPremium = rawData.reduce((sum, row) => sum + parsePremium(row[fieldMap.premium]), 0);

  const summary = {
    filteredPremium,
    filteredCount: filtered.length,
    ratio: totalPremium > 0 ? filteredPremium / totalPremium : 0
  };

  const result = {
    aggregated,
    summary,
    filterCount: filters.length
  };

  // 更新缓存
  lastFilterKey = filterKey;
  lastResult = result;

  sendProgress('filtering', 100);

  return result;
}

/**
 * 数据筛选（参考autowrKPI的AND/OR逻辑）
 * 多维度间: AND（所有条件必须同时满足）
 * 同维度多值: OR（任一值匹配即可）
 */
function filterData(data, filters) {
  if (!filters || filters.length === 0) {
    return data;
  }

  return data.filter(row => {
    // 所有筛选条件必须同时满足（AND）
    return filters.every(filter => {
      const fieldName = fieldMap[filter.key];
      if (!fieldName) {
        console.warn(`[Worker] 未映射的维度: ${filter.key}`);
        return true; // 未映射的维度忽略
      }

      const value = String(row[fieldName]);

      // 该维度的任一值匹配即可（OR）
      return filter.values.includes(value);
    });
  });
}

/**
 * 按维度聚合（参考autowrKPI的aggregateByDimension）
 */
function aggregateByDimension(data, groupBy) {
  const fieldName = fieldMap[groupBy];

  if (!fieldName) {
    throw new Error(`聚合维度未映射: ${groupBy}`);
  }

  const groups = {};
  const premiumField = fieldMap.premium;

  // 分组聚合
  data.forEach(row => {
    const key = row[fieldName];
    if (!key) return; // 跳过空值

    if (!groups[key]) {
      groups[key] = {
        dimension: key,
        premium: 0,
        count: 0
      };
    }

    groups[key].premium += parsePremium(row[premiumField]);
    groups[key].count += 1;
  });

  // 计算占比和排序
  const totalPremium = Object.values(groups).reduce((sum, g) => sum + g.premium, 0);

  const result = Object.values(groups)
    .map(g => ({
      dimension: g.dimension,
      premium: g.premium,
      ratio: totalPremium > 0 ? g.premium / totalPremium : 0,
      count: g.count,
      avgPremium: g.count > 0 ? g.premium / g.count : 0
    }))
    .sort((a, b) => b.premium - a.premium); // 按保费降序

  return result;
}

/**
 * 导出数据
 */
function exportData({ format, filtered }) {
  const data = filtered ? lastResult?.aggregated : rawData;

  if (!data) {
    throw new Error('没有可导出的数据');
  }

  if (format === 'csv') {
    return Papa.unparse(data);
  } else if (format === 'json') {
    return JSON.stringify(data, null, 2);
  } else {
    throw new Error('不支持的导出格式: ' + format);
  }
}

/**
 * 解析保费数值（并转换为万元）
 * @param {*} value - 原始保费值
 * @returns {number} 转换为万元后的保费
 */
function parsePremium(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  let num = 0;

  // 处理字符串格式的数字（如"1,234.56"）
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    num = parseFloat(cleaned);
  } else {
    num = parseFloat(value);
  }

  if (isNaN(num)) {
    return 0;
  }

  // 应用单位转换（转为万元）
  // divisor=1（万元）→ 不变
  // divisor=10（千元）→ 除以10
  // divisor=10000（元）→ 除以10000
  return num / premiumUnit.divisor;
}

/**
 * 发送进度事件
 */
function sendProgress(stage, percent) {
  self.postMessage({
    type: 'PROGRESS',
    payload: {
      stage,
      percent
    }
  });
}

console.log('[Worker] 数据处理Worker已就绪');
