# 保费收入多维度分析系统

> 基于autowrKPI架构的纯前端数据可视化工具

## 项目概述

专注于**保费收入**的多维度对比分析工具，支持电商式筛选体验、完全离线运行、Web Worker架构。

**数据来源**：`2025年1季度各机构分月多维保费收入.xlsx`

**核心功能**：
- ✅ Excel/CSV文件上传解析（2356行数据）
- ✅ 9个维度的多维度筛选（三级机构、起保月、客户类别等）
- ✅ 电商式下拉筛选器（draft → applied模式）
- ✅ 实时图表更新（ECharts 5.4.3）
- ✅ 4个核心指标卡片
- ✅ 月度趋势分析 + TOP5机构排名

## 快速开始

### 1. 启动本地服务器

```bash
# 进入项目目录
cd /Users/xuechenglong/Downloads/premium-analyzer

# 方式1: Python（推荐）
python3 -m http.server 8000

# 方式2: Node.js
npx http-server -p 8000

# 方式3: PHP
php -S localhost:8000
```

### 2. 访问应用

打开浏览器访问：`http://localhost:8000`

### 3. 上传数据

- 拖拽Excel文件到上传区域
- 或点击"选择文件"按钮
- 支持格式：`.csv`, `.xlsx`, `.xls`

### 4. 开始分析

- 查看总保费和月度趋势
- 使用左侧筛选器进行多维度筛选
- 点击"应用筛选"查看结果

## 项目结构

```
premium-analyzer/
├── index.html                       # 主页面
├── config/
│   ├── dimensions.json              # 维度配置（3个核心维度）
│   └── app-config.json              # 应用配置
├── css/
│   ├── themes.css                   # 主题配色（麦肯锡风格）
│   ├── main.css                     # 全局样式
│   └── components.css               # 组件样式
├── js/
│   ├── app.js                       # 应用入口
│   ├── core/
│   │   ├── event-bus.js             # 事件总线
│   │   ├── state-manager.js         # 状态管理
│   │   └── worker-bridge.js         # Worker通信桥接
│   ├── components/
│   │   ├── file-uploader.js         # 文件上传组件
│   │   ├── dimension-selector.js    # 维度筛选器
│   │   └── metric-card.js           # 指标卡片
│   ├── services/
│   │   └── chart-service.js         # ECharts图表服务
│   ├── utils/
│   │   ├── formatters.js            # 数值格式化
│   │   └── validators.js            # 数据验证
│   └── workers/
│       └── data.worker.js           # 数据处理引擎（600行）
└── README.md
```

## 技术栈

- **核心框架**：Vanilla JavaScript (ES6+)
- **数据处理**：Web Worker API（一次性监听器模式）
- **可视化**：ECharts 5.4.3
- **文件解析**：PapaParse (CSV) + SheetJS (Excel)
- **状态管理**：订阅发布模式（draft → applied）
- **样式**：麦肯锡风格（主题红 #a02724）

## 核心特性

### 1. Web Worker架构

- 大文件解析不阻塞主线程
- 一次性监听器模式防止内存泄漏
- 支持进度通知

### 2. 字段映射容错

支持多种CSV字段名：
```javascript
{
  "三级机构": ["三级机构", "机构名称", "organization"],
  "保费收入": ["保费收入", "保费", "premium", "签单保费"]
}
```

### 3. 多维度筛选逻辑

- **多维度间**：AND（所有条件必须同时满足）
- **同维度多值**：OR（任一值匹配即可）

示例：
```
筛选: 三级机构=["天府", "高新"] AND 客户类别=["非营业个人客车"]
```

### 4. 电商式筛选体验

- 草稿模式（draft）：用户选择中
- 应用模式（applied）：点击"应用筛选"后生效
- 已应用筛选标签可单独移除

## 数据字段映射

MVP阶段支持3个核心维度：

| 维度 | 配置Key | CSV字段名候选 | 颜色 |
|------|---------|--------------|------|
| 三级机构 | third_level_organization | "三级机构", "机构名称", "organization" | #0070c0 |
| 起保月 | start_month | "起保月", "保单月份", "month" | #00b050 |
| 客户类别 | customer_category | "客户类别", "车辆类型", "客户分类" | #ff0000 |
| **保费收入** | **premium** | **"保费收入", "保费", "premium"** | - |

## 使用说明

### 上传数据

1. 准备Excel文件，确保包含以下列：
   - 必须：保费收入（或"保费"/"premium"）
   - 可选：三级机构、起保月、客户类别

2. 拖拽文件到上传区域或点击选择

3. 系统自动解析并显示仪表盘

### 筛选数据

1. 点击左侧维度筛选器
2. 勾选需要的维度值
3. 点击"应用筛选"按钮
4. 图表和指标自动更新

### 重新导入数据

分析完当前数据后，如需切换到其他数据文件：

1. 点击右上角的 **📂 重新导入数据** 按钮
2. 在确认对话框中点击"确定"
3. 返回上传界面，选择新的数据文件
4. 无需刷新页面，保持单页应用体验

> **提示**：重新导入会清空当前的筛选和分析结果

### 查看图表

- **指标卡片**：总保费、已筛选保费、覆盖月份、平均单均保费
- **月度趋势图**：折线图 + 平均值线
- **TOP5机构图**：柱状图（按保费降序）

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 开发计划

### MVP阶段（已完成） ✅

- [x] 项目基础架构
- [x] 3个核心维度筛选
- [x] 文件上传解析
- [x] 基础可视化（2个图表）
- [x] 指标卡片
- [x] 电商式筛选器

### 完整版（后续）

- [ ] 支持全部9个维度
- [ ] 4个分析标签页
- [ ] 数据导出功能
- [ ] 本地存储（筛选配置）
- [ ] 交叉分析（堆叠柱状图）

## 故障排查

### Q: 页面加载报错？
A: 必须通过HTTP服务器访问（不能直接打开index.html），因为Worker需要HTTP协议。

### Q: 文件解析失败？
A: 确保Excel包含"保费收入"列（或"保费"/"premium"），这是必填字段。

### Q: 筛选无效？
A: 先选择维度值，然后点击"应用筛选"按钮（draft → applied模式）。

### Q: 图表不显示？
A: 检查浏览器控制台是否有错误，确保ECharts CDN已加载。

## 参考项目

本项目基于 **autowrKPI** 架构设计：
- 目录：`/Users/xuechenglong/Downloads/autowrKPI`
- 核心参考文件：
  - `js/workers/data.worker.js` - Worker数据处理引擎
  - `js/dashboard.js` - 维度筛选器实现
  - `css/dashboard.css` - 麦肯锡风格样式

## 技术文档

详细的架构设计和实施计划请查看：
- `/Users/xuechenglong/.claude/plans/jazzy-chasing-puffin.md`

## 许可证

MIT License

---

**创建时间**：2025-12-26
**版本**：1.0.0-MVP
**作者**：基于autowrKPI架构设计
