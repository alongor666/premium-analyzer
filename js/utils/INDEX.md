# /js/utils/ - 工具函数层

> **纯函数工具集**

最后更新: 2026-01-04

---

## 🎯 目录职责

本目录包含应用的所有工具函数,采用纯函数设计模式,无副作用,易于测试和复用。提供数值格式化、数据验证、存储管理、数据导出等通用功能。

---

## 🔗 关键入口

### 主要文件

#### 数据处理工具
- [formatters.js](formatters.js) - 数值格式化
  - 保费格式化(取整)
  - 占比格式化(1位小数)
  - 日期格式化
  - 通用数字格式化

- [validators.js](validators.js) - 数据验证
  - CSV结构验证
  - 数据完整性检查
  - 字段映射验证

- [data-processor.js](data-processor.js) - 数据处理
  - 占比计算(全局贡献度、时间序列、年度比率、当月车险比)
  - 增长率计算
  - 数据聚合

- [date-sorter.js](date-sorter.js) - 时间排序
  - 月份自然排序
  - 季度/年份排序
  - 自动识别格式

#### 存储和导出工具
- [storage.js](storage.js) - localStorage封装
  - 状态持久化
  - 数据导出/导入
  - 存储空间管理

- [exporter.js](exporter.js) - CSV/Excel导出
  - CSV格式导出
  - Excel格式导出(未来)
  - 数据编码处理

#### 调试和错误处理工具
- [error-handler.js](error-handler.js) - 全局错误处理
  - 统一错误捕获
  - 用户友好提示
  - 错误日志记录

- [logger.js](logger.js) - 结构化日志
  - 调试日志
  - 性能监控
  - 日志级别管理

#### 其他工具
- [shortcuts.js](shortcuts.js) - 键盘快捷键
  - 快捷键注册
  - 快捷键提示
  - 冲突检测

### 测试文件
- 无(当前无单元测试)

---

## 📚 全局索引链接
- 📖 [文档索引](../../docs/00_index/DOC_INDEX.md)
- 💻 [代码索引](../../docs/00_index/CODE_INDEX.md)
- 📊 [进展索引](../../docs/00_index/PROGRESS_INDEX.md)

---

## ⚠️ 约束条件

### 禁止修改
- 🚫 **禁止修改**: 已有工具函数的签名和行为
- 🚫 **禁止修改**: 数值格式化精度(保费取整,占比1位小数)

### 允许操作
- ✅ **允许操作**: 添加新工具函数
- ✅ **允许操作**: 优化现有函数性能
- ✅ **允许操作**: 扩展函数功能(保持向后兼容)

### 设计原则
- **纯函数**: 无副作用,相同输入产生相同输出
- **可组合**: 函数可以组合使用
- **易测试**: 纯函数易于单元测试
- **性能优先**: 优化热点函数

---

## 📊 代码统计

| 文件 | 估计行数 | 状态 | 复杂度 |
|------|----------|------|--------|
| formatters.js | ~100 | ✅ 稳定 | 低 |
| validators.js | ~150 | ✅ 稳定 | 中 |
| data-processor.js | ~300 | ✅ 可扩展 | 中 |
| date-sorter.js | ~100 | ✅ 稳定 | 低 |
| storage.js | ~100 | ✅ 稳定 | 低 |
| exporter.js | ~150 | 🚧 开发中 | 中 |
| error-handler.js | ~100 | ✅ 稳定 | 低 |
| logger.js | ~80 | ✅ 稳定 | 低 |
| shortcuts.js | ~120 | 📝 规划中 | 中 |

---

## 🎯 使用指南

### Formatters使用示例
```javascript
// 保费格式化(取整)
formatPremium(12345.67);  // => "12,346 万元"

// 占比格式化(1位小数)
formatRatio(0.2567);      // => "25.7%"

// 通用数字格式化
formatNumber(1234.567, '0,0.00');  // => "1,234.57"
```

### DataProcessor使用示例
```javascript
// 计算贡献度
const data = [
  { dimension: '1月', premium: 100 },
  { dimension: '2月', premium: 200 }
];
const result = DataProcessor.calculateContribution(data);
// => [{ dimension: '1月', premium: 100, contribution: 33.33 }, ...]

// 计算占当月车险比
const result = DataProcessor.calculateMonthlyRatio(filteredData, totalData);
```

### DateSorter使用示例
```javascript
// 月份排序
const sorted = DateSorter.sortByMonth(data);
// => [1月, 2月, ..., 12月]
```

---

## 📞 联系信息
- **负责人**: 开发团队
- **更新频率**: 按需(新功能添加时)
- **相关文档**: [CLAUDE.md](../../CLAUDE.md) - 可复用组件库

---

*维护者: 开发团队*
*最后更新: 2026-01-04*
