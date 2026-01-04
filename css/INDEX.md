# /css/ - 样式系统

> **McKinsey风格主题**

最后更新: 2026-01-04

---

## 🎯 目录职责

本目录包含应用的所有样式文件,采用McKinsey风格设计系统,确保视觉一致性和专业感。支持响应式布局,适配不同屏幕尺寸。

---

## 🔗 关键入口

### 主要文件
- [themes.css](themes.css) - 颜色系统
  - McKinsey品牌色 `#a02724`
  - 维度配色方案
  - 语义化颜色变量
  - 主题色板

- [main.css](main.css) - 布局和排版
  - 全局样式
  - 布局系统
  - 排版规则
  - 响应式断点

- [components.css](components.css) - 组件样式
  - 文件上传器样式
  - 维度选择器样式
  - 指标卡片样式
  - 图表容器样式
  - 筛选标签样式

### 测试文件
- 无(样式文件无需测试)

---

## 📚 全局索引链接
- 📖 [文档索引](../../docs/00_index/DOC_INDEX.md)
- 💻 [代码索引](../../docs/00_index/CODE_INDEX.md)
- 📊 [进展索引](../../docs/00_index/PROGRESS_INDEX.md)

---

## ⚠️ 约束条件

### 禁止修改
- 🚫 **禁止修改**: McKinsey主题色 `#a02724`
- 🚫 **禁止修改**: 核心样式系统
- 🚫 **禁止修改**: 维度配色方案

### 允许操作
- ✅ **允许操作**: 添加新组件样式
- ✅ **允许操作**: 调整响应式断点
- ✅ **允许操作**: 优化样式性能

### 设计原则
- **McKinsey风格**: 专业、简洁、数据驱动
- **颜色一致性**: 使用CSS变量管理颜色
- **响应式**: 移动优先,渐进增强
- **性能优先**: 避免深层嵌套,使用高效选择器

---

## 📊 样式统计

| 文件 | 估计行数 | 状态 | 复杂度 |
|------|----------|------|--------|
| themes.css | ~200 | ✅ 稳定 | 低 |
| main.css | ~400 | ✅ 稳定 | 中 |
| components.css | ~200 | ✅ 稳定 | 中 |

---

## 🎨 颜色系统

### McKinsey主题色
```css
:root {
  --brand-red: #a02724;      /* McKinsey品牌红 */
  --dark-gray: #2c2c2c;      /* 标题颜色 */
  --medium-gray: #666;       /* 正文颜色 */
  --light-gray: #f5f5f5;     /* 背景颜色 */
}
```

### 维度配色
```css
:root {
  --dimension-1: #0070c0;    /* 三级机构 - 蓝 */
  --dimension-2: #00b050;    /* 起保月 - 绿 */
  --dimension-3: #ff0000;    /* 客户类别 - 红 */
  /* ... 更多维度颜色 */
}
```

---

## 🎯 使用指南

### 使用CSS变量
```css
.custom-element {
  color: var(--brand-red);
  background: var(--light-gray);
}
```

### 响应式断点
```css
/* 移动设备 */
@media (max-width: 768px) {
  /* 移动端样式 */
}

/* 平板设备 */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 平板端样式 */
}

/* 桌面设备 */
@media (min-width: 1025px) {
  /* 桌面端样式 */
}
```

### 组件样式示例
```css
/* 按钮样式 */
.btn {
  background: var(--brand-red);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
}

.btn:hover {
  background: #8a2020;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}
```

---

## 📈 性能优化

### 样式优化策略
- **使用CSS变量**: 减少重复代码
- **避免深层嵌套**: 提高选择器效率
- **使用will-change**: 优化动画性能
- **压缩CSS**: 减少文件大小

### 当前性能
- **总CSS大小**: ~30KB (未压缩)
- **首次加载**: <100ms
- **重绘性能**: 60fps

---

## 📞 联系信息
- **负责人**: UI/UX团队
- **更新频率**: 按需(新组件添加时)
- **相关文档**: [CLAUDE.md](../../CLAUDE.md) - McKinsey设计系统

---

*维护者: UI/UX团队*
*最后更新: 2026-01-04*
