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
 * 解析文件
 * @param {Object} payload - { fileContent, fileName, fileType }
 */
async function parseFile({ fileContent, fileName, fileType }) {
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

  // 3. 构建字段映射
  if (cleanedData.length > 0) {
    buildFieldMap(cleanedData[0]);
  } else {
    throw new Error('文件为空或格式错误');
  }

  sendProgress('parsing', 80);

  // 4. 计算全局统计
  const stats = calculateGlobalStats(cleanedData);

  // 5. 提取维度唯一值
  const dimensions = extractDimensions(cleanedData);

  // 6. 缓存原始数据到Worker
  rawData = cleanedData;

  sendProgress('parsing', 100);

  return {
    total: cleanedData.length,
    premium: stats.totalPremium,
    dimensions,
    monthRange: stats.monthRange,
    fields: Object.keys(cleanedData[0])
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
 * 构建字段映射（参考autowrKPI的dimensionConfigMap）
 * 支持多候选字段名容错
 */
function buildFieldMap(sampleRow) {
  const config = {
    third_level_organization: ['三级机构', '机构名称', 'organization', '三级机构名称'],
    start_month: ['起保月', '保单月份', '起保日期', 'month', 'start_month'],
    customer_category: ['客户类别', '车辆类型', '客户分类'],

    // 新增：7个维度
    energy_type: ['能源类型', '是否新能源', '新能源', '能源', 'energy_type'],
    coverage_type: ['险别组合', '险别', '保险类型', 'coverage_type'],
    is_transferred_vehicle: ['是否过户车', '过户车', '是否过户', 'transfer_status'],
    renewal_status: ['续保状态', '是否续保', '续保', 'renewal', '转续保'],
    business_type: ['业务类型', '业务', 'business_type'],
    tonnage_segment: ['吨位分段', '吨位', 'tonnage', '吨位段'],
    insurance_type: ['险种', '保险险种', '险种类型', 'insurance'],
    terminal_source: ['终端来源', '渠道', '来源', 'source', 'channel'],

    premium: ['保费收入', '保费', 'premium', '签单保费', '保险费']
  };

  const notFound = [];

  Object.keys(config).forEach(key => {
    const possibleNames = config[key];
    const actualField = possibleNames.find(name => sampleRow.hasOwnProperty(name));

    if (actualField) {
      fieldMap[key] = actualField;
    } else {
      notFound.push(key);
    }
  });

  // 关键字段（保费）必须存在
  if (notFound.includes('premium')) {
    const premiumFields = config.premium.join(', ');
    throw new Error(`关键字段缺失: 保费收入字段未找到。\n请确保Excel中包含以下任一列名: ${premiumFields}`);
  }

  // 警告非关键字段缺失
  if (notFound.length > 0) {
    console.warn('[Worker] 以下维度字段未找到:', notFound, '这些维度将不可用');
  }

  console.log('[Worker] 字段映射:', fieldMap);
  return fieldMap;
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
 * 解析保费数值
 */
function parsePremium(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  // 处理字符串格式的数字（如"1,234.56"）
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
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
