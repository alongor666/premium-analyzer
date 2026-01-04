# /js/core/ - 核心业务逻辑层

> **事件驱动架构和状态管理**

最后更新: 2026-01-04

---

## 🎯 目录职责

本目录包含应用的核心业务逻辑层,负责事件驱动通信、状态管理和Web Worker通信桥接。采用Pub-Sub模式实现组件解耦,通过draft → applied状态模式管理筛选器状态,使用一次性监听器模式防止内存泄漏。

---

## 🔗 关键入口

### 主要文件
- [event-bus.js](event-bus.js) - Pub-Sub事件总线
  - 全局组件通信机制
  - 事件发布/订阅模式
  - 支持事件命名空间

- [state-manager.js](state-manager.js) - 状态管理器
  - draft → applied 状态模式
  - 筛选器状态管理
  - 深度合并和状态持久化

- [worker-bridge.js](worker-bridge.js) - Web Worker通信桥
  - 一次性监听器模式
  - 防止内存泄漏
  - 消息传递和响应处理

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
- 🚫 **禁止修改**: 核心业务逻辑(已通过安全审计)
- 🚫 **禁止修改**: 事件总线核心机制
- 🚫 **禁止修改**: 状态管理转换逻辑
- 🚫 **禁止修改**: Worker桥接模式

### 允许操作
- ✅ **允许操作**: 添加新事件类型到EventBus
- ✅ **允许操作**: 扩展StateManager状态字段
- ✅ **允许操作**: 添加新的Worker消息类型

### 设计原则
- **Pub-Sub模式**: 组件通过事件通信,不直接引用
- **一次性监听器**: Worker消息监听器自动清理,防止内存泄漏
- **状态机**: Draft → Applied 状态转换,用户确认后生效
- **单一职责**: 每个模块只负责一个核心功能

---

## 📊 代码统计

| 文件 | 估计行数 | 状态 | 复杂度 |
|------|----------|------|--------|
| event-bus.js | ~150 | ✅ 稳定 | 低 |
| state-manager.js | ~300 | ✅ 稳定 | 中 |
| worker-bridge.js | ~200 | ✅ 稳定 | 中 |

---

## 🎯 使用指南

### EventBus使用示例
```javascript
// 发布事件
EventBus.emit('data-loaded', { rows: parsedData });

// 订阅事件
EventBus.on('filters-changed', (data) => {
  console.log('Filters updated:', data);
});

// 取消订阅
EventBus.off('filters-changed', handler);
```

### StateManager使用示例
```javascript
// 设置draft筛选器
StateManager.setDraftFilter('dimension', ['value1', 'value2']);

// 应用筛选器(draft → applied)
StateManager.applyFilters();

// 获取已应用筛选器
const applied = StateManager.getAppliedFilters();
```

### WorkerBridge使用示例
```javascript
// 发送消息到Worker(一次性监听器)
WorkerBridge.sendMessage('parse-csv', data, (result) => {
  console.log('CSV parsed:', result);
  // 监听器自动清理,无需手动移除
});
```

---

## 📞 联系信息
- **负责人**: 架构师
- **更新频率**: 按需(核心逻辑稳定)
- **相关文档**: [CLAUDE.md](../../CLAUDE.md) - 架构详细说明

---

*维护者: 开发团队*
*最后更新: 2026-01-04*
