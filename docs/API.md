# API 文档

## 核心类

### PremiumAnalyzer
应用主类，负责初始化和协调各组件。

#### 方法

##### `init()`
初始化应用。

**返回**: `Promise<void>`

**示例**:
```javascript
await window.app.init();
```

##### `switchTab(tabName)`
切换标签页。

**参数**:
- `tabName` (string): 标签页名称 (`'overview' | 'organization' | 'dimension' | 'detail'`)

**示例**:
```javascript
window.app.switchTab('organization');
```

##### `renderDashboard()`
渲染初始仪表盘（无筛选条件）。

**返回**: `Promise<void>`

##### `updateDashboard(result)`
更新仪表盘（筛选后）。

**参数**:
- `result` (Object): 筛选结果对象
  - `aggregated` (Array): 聚合数据
  - `summary` (Object): 汇总信息

##### `exportData()`
导出数据为Excel或CSV格式。

##### `showError(title, message)`
显示错误模态框。

**参数**:
- `title` (string): 错误标题
- `message` (string): 错误消息

---

### StateManager
全局状态管理器，使用订阅发布模式管理应用状态。

#### 方法

##### `setState(updates)`
更新状态并通知监听器。

**参数**:
- `updates` (Object): 状态更新对象

**示例**:
```javascript
window.StateManager.setState({
  aggregatedData: newData,
  currentGroupBy: 'start_month'
});
```

##### `getState(key)`
获取状态值。

**参数**:
- `key` (string, optional): 状态键，不传则返回全部状态

**返回**: 状态值

**示例**:
```javascript
const data = window.StateManager.getState('aggregatedData');
const allState = window.StateManager.getState();
```

##### `subscribe(key, callback)`
订阅状态变化。

**参数**:
- `key` (string): 状态键
- `callback` (Function): 回调函数 `(newValue, oldValue) => void`

**返回**: 取消订阅函数

**示例**:
```javascript
const unsubscribe = window.StateManager.subscribe('aggregatedData', (newData, oldData) => {
  console.log('数据已更新:', newData);
});

// 取消订阅
unsubscribe();
```

##### `updateDraftFilter(dimensionKey, values)`
更新草稿筛选状态。

**参数**:
- `dimensionKey` (string): 维度键
- `values` (Array): 选中的值

##### `applyFilters()`
应用筛选（draft → applied）。

##### `clearFilters()`
清空所有筛选。

##### `reset()`
重置所有状态。

---

### ChartService
图表服务，使用 ECharts 渲染图表。

#### 方法

##### `renderChart(containerId, chartType, data)`
渲染图表。

**参数**:
- `containerId` (string): 容器DOM元素的ID
- `chartType` (string): 图表类型 (`'line' | 'bar' | 'pie'`)
- `data` (Array): 数据数组，每个元素包含：
  - `dimension` (string): 维度名称
  - `premium` (number): 保费金额
  - `ratio` (number): 占比
  - `count` (number): 记录数

**示例**:
```javascript
const data = [
  { dimension: '机构A', premium: 1000000, ratio: 0.3, count: 100 },
  { dimension: '机构B', premium: 800000, ratio: 0.24, count: 80 }
];

chartService.renderChart('chartCanvas', 'bar', data);
```

---

### WorkerBridge
Worker通信桥接层，负责与Web Worker通信。

#### 方法

##### `init()`
初始化Worker。

##### `parseFile(file)`
解析文件（Excel或CSV）。

**参数**:
- `file` (File): 文件对象

**返回**: `Promise<Object>` - 解析结果

**示例**:
```javascript
const result = await window.WorkerBridge.parseFile(file);
// result: { total, premium, dimensions, monthRange, fields }
```

##### `applyFilter(filters, groupBy)`
应用筛选并聚合数据。

**参数**:
- `filters` (Array): 筛选条件 `[{key, values}]`
- `groupBy` (string): 聚合维度

**返回**: `Promise<Object>` - 聚合结果

**示例**:
```javascript
const result = await window.WorkerBridge.applyFilter(
  [{ key: 'customer_category', values: ['个人', '企业'] }],
  'third_level_organization'
);
// result: { aggregated, summary, filterCount }
```

##### `onProgress(callback)`
监听Worker进度事件。

**参数**:
- `callback` (Function): 进度回调 `(payload) => void`
  - `payload.stage` (string): 阶段名称
  - `payload.percent` (number): 进度百分比

**返回**: 取消监听函数

##### `clearCache()`
清除查询缓存。

##### `destroy()`
销毁Worker。

---

### DataExporter
数据导出工具。

#### 静态方法

##### `exportToCSV(data, filename)`
导出为CSV格式。

**参数**:
- `data` (Array): 数据数组
- `filename` (string, optional): 文件名，默认为 `'data.csv'`

**示例**:
```javascript
window.DataExporter.exportToCSV(aggregatedData, '保费分析_2025-03-15.csv');
```

##### `exportToExcel(data, filename)`
导出为Excel格式（.xlsx）。

**参数**:
- `data` (Array): 数据数组
- `filename` (string, optional): 文件名，默认为 `'data.xlsx'`

**示例**:
```javascript
window.DataExporter.exportToExcel(aggregatedData, '保费分析_2025-03-15.xlsx');
```

---

### StorageManager
本地存储工具，用于保存和加载用户配置。

#### 方法

##### `saveFilters(filters)`
保存筛选配置到 localStorage。

**参数**:
- `filters` (Array): 筛选条件 `[{key, values}]`

##### `loadFilters()`
加载保存的筛选配置。

**返回**: `Array|null` - 筛选条件或null

##### `clearFilters()`
清除保存的筛选配置。

##### `savePreferences(preferences)`
保存用户偏好设置。

**参数**:
- `preferences` (Object): 偏好设置对象

##### `loadPreferences()`
加载用户偏好设置。

**返回**: `Object` - 偏好设置对象

**示例**:
```javascript
const prefs = window.StorageManager.loadPreferences();
// { autoSave: true, defaultGroupBy: 'third_level_organization', theme: 'light' }
```

##### `clearAll()`
清除所有保存的数据。

---

### ShortcutManager
快捷键管理器。

#### 快捷键列表

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` | 应用筛选 |
| `Ctrl+R` | 重置筛选 |
| `Ctrl+E` | 导出数据 |
| `Ctrl+1` | 切换到概览分析页 |
| `Ctrl+2` | 切换到机构对比页 |
| `Ctrl+3` | 切换到维度分析页 |
| `Ctrl+4` | 切换到明细数据页 |

---

## 事件系统

### EventBus 事件列表

应用使用 EventBus 进行组件间通信。

#### 可用事件

##### `file:parsed`
文件解析完成时触发。

**Payload**: `Object`
- `total` (number): 总记录数
- `premium` (number): 总保费
- `dimensions` (Object): 维度唯一值
- `monthRange` (Array): 月份范围

**示例**:
```javascript
window.EventBus.on('file:parsed', (result) => {
  console.log('文件解析完成:', result);
});
```

##### `filters:applied`
筛选应用时触发。

**Payload**: `Array` - 筛选条件 `[{key, values}]`

##### `filters:cleared`
筛选清空时触发。

**Payload**: 无

##### `state:reset`
状态重置时触发。

**Payload**: 无

#### 使用方法

```javascript
// 监听事件
window.EventBus.on('event:name', (payload) => {
  console.log('事件触发:', payload);
});

// 触发事件
window.EventBus.emit('event:name', payload);

// 取消监听
window.EventBus.off('event:name', handler);
```

---

## 数据结构

### 聚合数据项

```typescript
interface AggregatedItem {
  dimension: string;    // 维度值
  premium: number;      // 保费金额（元）
  ratio: number;        // 占比（0-1）
  count: number;        // 记录数
  avgPremium: number;   // 平均单均保费
}
```

### 筛选条件

```typescript
interface FilterCondition {
  key: string;          // 维度键
  values: string[];     // 选中的值数组
}
```

### 全局状态

```typescript
interface AppState {
  rawData: Object | null;           // 原始数据
  filters: {
    draft: Object;                  // 草稿筛选 { [key]: string[] }
    applied: FilterCondition[];     // 已应用筛选
  };
  currentGroupBy: string;           // 当前聚合维度
  activeTab: string;                // 当前标签页
  aggregatedData: AggregatedItem[]; // 聚合数据
  globalStats: {
    totalPremium: number;           // 总保费
    totalCount: number;             // 总记录数
    monthRange: string[];           // 月份范围
  };
  dimensions: Object;               // 维度唯一值
  ui: {
    activeDropdown: string | null;  // 当前打开的下拉
    loading: boolean;               // 加载状态
    error: string | null;           // 错误信息
  };
}
```

---

## 配置文件

### dimensions.json
定义维度配置。

```json
{
  "dimensions": [
    {
      "key": "third_level_organization",
      "label": "三级机构",
      "type": "string"
    }
  ],
  "metric": {
    "key": "premium",
    "label": "保费收入（万元）"
  }
}
```

### app-config.json
应用配置。

```json
{
  "appName": "保费收入多维度分析系统",
  "version": "1.0.0",
  "maxFileSize": 10485760,
  "supportedFormats": [".csv", ".xlsx", ".xls"]
}
```
