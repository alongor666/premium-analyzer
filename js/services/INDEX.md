# /js/services/ - 外部服务层

> **第三方服务集成**

最后更新: 2026-01-04

---

## 🎯 目录职责

本目录包含所有第三方服务的集成封装,提供统一的接口层,便于替换和升级。当前主要包括ECharts图表服务的封装。

---

## 🔗 关键入口

### 主要文件
- [chart-service.js](chart-service.js) - ECharts图表服务
  - 图表渲染封装
  - 双Y轴图表支持
  - 响应式适配
  - 图表主题配置
  - 数据格式转换

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
- 🚫 **禁止修改**: 图表核心逻辑
- 🚫 **禁止修改**: 双Y轴图表配置
- 🚫 **禁止修改**: McKinsey主题色 `#a02724`

### 允许操作
- ✅ **允许操作**: 添加新图表类型
- ✅ **允许操作**: 扩展图表配置选项
- ✅ **允许操作**: 优化图表渲染性能

### 设计原则
- **统一封装**: 所有图表通过ChartService创建
- **配置驱动**: 图表通过配置对象生成
- **响应式**: 自动适配容器尺寸
- **主题一致**: 使用McKinsey主题

---

## 📊 代码统计

| 文件 | 估计行数 | 状态 | 复杂度 |
|------|----------|------|--------|
| chart-service.js | ~600 | ✅ 稳定 | 中 |

---

## 🎯 使用指南

### ChartService基础用法
```javascript
// 渲染单Y轴图表
chartService.renderChart('chartId', 'line', data, {
  title: '月度保费趋势',
  xAxis: 'month',
  yAxis: 'premium'
});

// 渲染双Y轴图表
chartService.renderChart('chartId', 'dualAxisLine', data, {
  leftAxisName: '保费收入(万元)',
  rightAxisName: '占年度保费比(%)',
  rightAxisField: 'annualRatio',
  rightAxisMax: 20
});
```

### 支持的图表类型
- `line` - 折线图
- `bar` - 柱状图
- `pie` - 饼图
- `dualAxisLine` - 双Y轴折线图
- `stackedBar` - 堆叠柱状图(未来)

### 图表配置选项
```javascript
{
  title: String,           // 图表标题
  xAxis: String,           // X轴字段
  yAxis: String,           // Y轴字段
  rotateXLabel: Boolean,   // 是否旋转X轴标签
  showDataZoom: Boolean,   // 是否显示数据缩放
  sortByTime: Boolean,     // 是否按时间排序
  // ... 更多配置选项
}
```

---

## 📈 ECharts集成

### CDN依赖
```html
<script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js"></script>
```

### 版本信息
- **当前版本**: ECharts 5.4.3
- **兼容性**: 现代浏览器(Chrome, Firefox, Safari, Edge)

---

## 📞 联系信息
- **负责人**: 前端开发团队
- **更新频率**: 按需(新图表类型添加时)
- **相关文档**: [CLAUDE.md](../../CLAUDE.md) - 双Y轴图表组件

---

*维护者: 前端开发团队*
*最后更新: 2026-01-04*
