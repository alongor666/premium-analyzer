# /config/ - 配置驱动层

> **JSON驱动配置**

最后更新: 2026-01-04

---

## 🎯 目录职责

本目录包含应用的所有配置文件,采用JSON格式,实现配置驱动的设计模式。所有维度定义、应用设置、性能参数都通过配置文件管理,避免硬编码,提高灵活性和可维护性。

---

## 🔗 关键入口

### 主要文件
- [dimensions.json](dimensions.json) - 9个维度定义
  - 维度配置(key, label, csvFields, color, group)
  - CSV字段映射(支持多种列名变体)
  - 颜色配置
  - 排序和搜索配置

- [app-config.json](app-config.json) - 应用配置
  - 性能配置(Worker线程数、缓存大小)
  - UI配置(图表尺寸、动画时长)
  - 导出配置(文件名格式、编码)
  - 调试配置(日志级别)

### 测试文件
- 无(配置文件无需测试)

---

## 📚 全局索引链接
- 📖 [文档索引](../../docs/00_index/DOC_INDEX.md)
- 💻 [代码索引](../../docs/00_index/CODE_INDEX.md)
- 📊 [进展索引](../../docs/00_index/PROGRESS_INDEX.md)

---

## ⚠️ 约束条件

### 禁止修改
- 🚫 **禁止修改**: `dimensions.json` 中的维度定义(需业务部门批准)
- 🚫 **禁止修改**: 已有维度的key和label
- 🚫 **禁止修改**: McKinsey主题色 `#a02724`

### 允许操作
- ✅ **允许操作**: 添加CSV字段别名到csvFields数组
- ✅ **允许操作**: 添加新维度(需业务部门批准)
- ✅ **允许操作**: 调整app-config.json中的性能参数

### 设计原则
- **配置驱动**: UI通过配置自动生成
- **向后兼容**: 新增字段不影响现有功能
- **业务隔离**: 维度定义需业务部门批准

---

## 📊 配置统计

### dimensions.json结构
```json
{
  "dimensions": [
    {
      "key": "third_level_organization",
      "label": "三级机构",
      "csvFields": ["三级机构", "机构名称", "organization", "三级机构名称"],
      "color": "#0070c0",
      "group": 1,
      "sortable": true,
      "searchable": true
    },
    // ... 共9个维度
  ]
}
```

### app-config.json结构
```json
{
  "performance": {
    "workerThreads": 2,
    "cacheSize": 1000
  },
  "ui": {
    "chartHeight": 400,
    "animationDuration": 300
  },
  "export": {
    "filenameFormat": "premium_analysis_{timestamp}",
    "encoding": "utf-8"
  },
  "debug": {
    "logLevel": "info"
  }
}
```

---

## 🎯 使用指南

### 添加新维度(需审批)
1. 向业务部门提交申请
2. 获得批准后在`dimensions.json`中添加:
```json
{
  "key": "new_dimension",
  "label": "新维度",
  "csvFields": ["新维度", "new_dimension", "别名1", "别名2"],
  "color": "#RRGGBB",
  "group": 4,
  "sortable": true,
  "searchable": true
}
```

### 添加CSV字段别名
1. 在目标维度的csvFields数组中添加:
```json
"csvFields": ["原有字段", "新字段别名"]
```
2. 无需审批,立即生效

### 调整性能参数
1. 修改`app-config.json`:
```json
{
  "performance": {
    "workerThreads": 4,  // 增加Worker线程
    "cacheSize": 2000    // 增加缓存大小
  }
}
```

---

## 📞 联系信息
- **负责人**: 数据分析团队(维度定义)
- **更新频率**: 按需(新维度添加时)
- **审批流程**: 维度定义变更需业务部门批准
- **相关文档**: [CLAUDE.md](../../CLAUDE.md) - 配置驱动开发

---

*维护者: 数据分析团队*
*最后更新: 2026-01-04*
