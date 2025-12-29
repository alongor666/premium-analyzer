# CLAUDE.md

Essential guidance for Claude Code when working with this repository.

**Version:** 1.0.0
**Project:** Premium Income Multi-Dimensional Analysis System (保费收入多维度分析系统)
**Last Updated:** 2025-12-26

---

## 🎯 Project Overview

**Data Visualization Platform** for insurance premium income multi-dimensional comparison analysis.

**What**: Pure frontend analytics tool with e-commerce style filtering, complete offline capability, and Web Worker architecture for processing 2,356+ data rows from Excel files.

**Why**: Enable rapid data exploration and visual insights for insurance premium income across 9 dimensions without backend infrastructure or database setup.

**Key Business Context**:
- **9 Dimensions**: 三级机构, 起保月, 客户类别, 能源类型, 险别组合, 是否过户车, 续保状态, 险种, 终端来源
- **1 Metric**: 保费收入 (Premium Income)
- **Data Source**: `2025年1季度各机构分月多维保费收入.xlsx` (2,356 rows)
- **CRITICAL**: All configuration is JSON-driven, modifications should update config files, not hardcoded logic

---

## 🛠️ Tech Stack

- **Runtime**: Browser-native (no build tools)
- **Language**: Vanilla JavaScript (ES6+)
- **Package Manager**: None (CDN dependencies only)
- **Architecture**: Web Worker + Event-Driven
- **Visualization**: ECharts 5.4.3
- **File Parsing**: PapaParse (CSV) + SheetJS (Excel)
- **State Management**: Pub-Sub pattern (draft → applied)
- **Styling**: McKinsey style theme (#a02724)

### Essential Commands

```bash
# Start local HTTP server (REQUIRED - cannot use file:// protocol)
python3 -m http.server 8000        # Python (recommended)
npx http-server -p 8000            # Node.js alternative
php -S localhost:8000              # PHP alternative

# Access application
open http://localhost:8000
```

**Why HTTP Server Required**: Web Workers require HTTP/HTTPS protocol for security reasons.

---

## 🏗️ Architecture

**Component-Based Architecture** (no framework, pure separation of concerns):

### Core Layers

```
premium-analyzer/
├── index.html                    # Main entry (SPA)
├── config/                       # JSON-driven configuration (AUTHORITY)
│   ├── dimensions.json           # 9 dimensions + metric definitions
│   └── app-config.json           # Performance, UI, export settings
├── css/                          # McKinsey-style theming
│   ├── themes.css                # Color system
│   ├── main.css                  # Layout & typography
│   └── components.css            # Component-specific styles
├── js/
│   ├── app.js                    # Application entry point
│   ├── core/                     # Foundation layer
│   │   ├── event-bus.js          # Pub-Sub messaging (central nervous system)
│   │   ├── state-manager.js      # Application state (draft/applied filters)
│   │   └── worker-bridge.js      # Web Worker communication (one-time listeners)
│   ├── components/               # UI components
│   │   ├── file-uploader.js      # Drag & drop + file parsing
│   │   ├── dimension-selector.js # E-commerce style multi-select
│   │   └── metric-card.js        # KPI cards
│   ├── services/                 # External integrations
│   │   └── chart-service.js      # ECharts abstraction layer
│   ├── utils/                    # Pure functions
│   │   ├── formatters.js         # Number/date/currency formatting
│   │   ├── validators.js         # Data validation
│   │   ├── logger.js             # Structured logging
│   │   ├── error-handler.js      # Global error handling
│   │   ├── storage.js            # localStorage wrapper
│   │   ├── exporter.js           # CSV/Excel export
│   │   └── shortcuts.js          # Keyboard shortcuts
│   └── workers/
│       └── data.worker.js        # Data processing engine (600+ lines)
└── docs/                         # Technical documentation
```

### Architecture Principles

1. **Configuration over Code**: All dimensions, metrics, and UI settings are JSON-driven
2. **Event-Driven Communication**: Components communicate via EventBus, not direct references
3. **Worker-Based Processing**: All heavy data operations run in Web Worker to prevent UI freezing
4. **One-Time Listeners**: Worker bridge uses one-time event listeners to prevent memory leaks
5. **Progressive Enhancement**: Core functionality works without localStorage/export features

---

## 🔄 Critical Workflows

### 1. Configuration-Driven Development

**ALWAYS follow** when adding/modifying dimensions or metrics:

1. **Read `config/dimensions.json` first**
2. Modify JSON configuration (add dimension/change field mapping)
3. **No code changes needed** - UI auto-adapts to config
4. Test with sample Excel file
5. Commit config changes

**Example - Adding new dimension**:
```json
{
  "key": "policy_holder_type",
  "label": "投保人类型",
  "csvFields": ["投保人类型", "holder_type", "客户类型"],
  "color": "#4472c4",
  "group": 3,
  "sortable": true,
  "searchable": true
}
```

**Why**: Configuration is the source of truth. UI components dynamically render based on config, avoiding hardcoded logic.

### 2. CSV Field Mapping (Flexible Matching)

**All CSV columns support multiple name variations**:

```javascript
// System tries each candidate until match found
{
  "三级机构": ["三级机构", "机构名称", "organization", "三级机构名称"],
  "保费收入": ["保费收入", "保费", "premium", "签单保费", "保险费"]
}
```

**Matching Logic**: Case-insensitive, trim whitespace, first match wins.

**Why**: Handles real-world CSV inconsistencies without manual preprocessing.

### 3. Filter Application Flow (Draft → Applied Pattern)

**Two-stage filtering** (e-commerce style):

```
User Selection (draft) → Click "Apply" → Active Filters (applied) → Charts Update
```

**State Transitions**:
1. **Draft State**: User checks/unchecks dimension values (stored in `StateManager.draftFilters`)
2. **Apply Action**: User clicks "应用筛选" button → copies draft to applied
3. **Applied State**: Triggers `filters-applied` event → Worker recalculates → Charts re-render
4. **Tag Removal**: User clicks ✕ on applied filter tag → removes from applied → auto-reapplies

**Why**: Prevents performance issues from real-time filtering on large datasets, gives users control over when to trigger expensive operations.

### 4. Web Worker Communication Pattern

**One-Time Listener Pattern** (critical for memory management):

```javascript
// ❌ WRONG - Memory leak
worker.addEventListener('message', handler);

// ✅ CORRECT - Auto-cleanup
WorkerBridge.sendMessage('parse-csv', data, (result) => {
  // Handler runs once, then removes itself
});
```

**Supported Operations**:
- `parse-csv`: File parsing (PapaParse/SheetJS)
- `apply-filters`: Multi-dimensional filtering
- `calculate-metrics`: Aggregation calculations
- `get-top-n`: Sorting & ranking

**Why**: Prevents memory leaks in long-running sessions with multiple filter operations.

### 5. Data Reload Flow (重新导入数据)

**Technical workflow for state reset**:

```
User Action → Confirmation → StateManager.clear() → UI Reset → Upload State
```

**Implementation**:
- **Method**: `app.js::reloadData()` (app.js:672-709)
- **Trigger**: Button click event (index.html:23-25)
- **State Cleanup**: Clears all StateManager data (rawData, globalStats, aggregatedData, filters)
- **UI Reset**: Hides dashboard, shows upload section
- **Documentation**: JSDoc in code, user guide in README.md

**Key Points**:
- Confirmation dialog prevents accidental data loss
- Complete state reset ensures clean application state
- Button visibility controlled by `file-uploader.js::showDashboard()`
- No EventBus events - direct DOM manipulation for simplicity

**Why**: Enables dataset switching without page refresh while maintaining state integrity.

---

## 🔑 Key Conventions

### Data Processing Rules

**Multi-Dimensional Filtering Logic**:
- **Between Dimensions**: AND (all conditions must be true)
- **Within Dimension**: OR (any value matches)

**Example**:
```javascript
// Filter: 三级机构 = ["天府", "高新"] AND 客户类别 = ["非营业个人客车"]
// Matches: (org=天府 OR org=高新) AND (category=非营业个人客车)
```

### Number Formatting

**Currency Display** (formatters.js:12):
```javascript
// Small numbers: 2 decimals
1234.56 → "1,234.56"

// Large numbers: abbreviate with unit
1234567 → "123.46万"
```

**Unit Handling**: Use `万元` for premium income (divide by 10,000).

### File Naming

- **Components**: PascalCase (e.g., `MetricCard.js`)
- **Utilities**: camelCase (e.g., `formatters.js`)
- **Workers**: `*.worker.js` suffix
- **Config**: kebab-case (e.g., `app-config.json`)

---

## ✅ Always Do / ❌ Never Do

**ALWAYS**:
- ✅ Update `config/dimensions.json` when adding dimensions (not code)
- ✅ Use WorkerBridge for data operations (never in main thread)
- ✅ Add CSV field name variations to `csvFields` array
- ✅ Use EventBus for component communication (decoupled)
- ✅ Test with sample Excel file after config changes
- ✅ Run via HTTP server (never `file://` protocol)
- ✅ Use one-time listeners for Worker messages

**NEVER**:
- ❌ Hardcode dimension names in JavaScript (use config)
- ❌ Perform heavy calculations in main thread (use Worker)
- ❌ Assume exact CSV column names (support variations)
- ❌ Directly couple components (use EventBus)
- ❌ Apply filters in real-time without "Apply" button
- ❌ Open `index.html` directly in browser (breaks Worker)
- ❌ Reuse Worker event listeners (causes memory leaks)

---

## 🧩 Component Communication Pattern

### Event-Driven Architecture

**All components communicate via EventBus**:

```javascript
// Publisher (file-uploader.js)
EventBus.emit('data-loaded', { rows: parsedData });

// Subscriber (metric-card.js)
EventBus.on('data-loaded', (data) => {
  this.updateMetrics(data.rows);
});
```

**Core Events**:
- `data-loaded`: Raw CSV data parsed
- `filters-changed`: Draft filters updated (not applied yet)
- `filters-applied`: Filters applied (triggers Worker)
- `data-filtered`: Worker returned filtered results
- `dimension-values-loaded`: Unique values for dimension dropdowns

**Why**: Decouples components, makes testing easier, allows dynamic module loading.

---

## 🔧 Code Quality & Debugging

### Browser Console Tools

**Debugging Commands** (available in browser console):
```javascript
// View current state
StateManager.getState()

// Check applied filters
StateManager.getAppliedFilters()

// View all registered events
EventBus.listEvents()

// Enable verbose logging
Logger.setLevel('debug')
```

### Performance Monitoring

**Worker Operations** (logged automatically):
- Parse time: CSV/Excel parsing duration
- Filter time: Multi-dimensional filtering duration
- Calculation time: Metric aggregation duration

**Chart Rendering** (ECharts debug mode):
```javascript
// Enable in browser console
chart.showLoading();
chart.hideLoading();
```

### Error Handling

**Global Error Boundary** (error-handler.js):
- Catches Worker errors → Shows user-friendly message
- Logs to console with stack trace
- Prevents app crash on CSV parsing errors

---

## 📚 Key Documentation

**For Claude** (read as needed):

1. **Architecture Design**: `/Users/xuechenglong/.claude/plans/jazzy-chasing-puffin.md`
2. **Configuration Schema**: `config/dimensions.json`, `config/app-config.json`
3. **Reference Implementation**: `/Users/xuechenglong/Downloads/autowrKPI`
4. **Action Plan**: `ACTION_PLAN.md` (original implementation plan)
5. **Deployment**: `DEPLOYMENT_STATUS.md` (GitHub Pages setup)

**Reference Files from autowrKPI**:
- `js/workers/data.worker.js` - Worker data processing engine
- `js/dashboard.js` - Dimension selector implementation
- `css/dashboard.css` - McKinsey style system

---

## 🆘 Troubleshooting

### Common Issues

**Q: Worker not loading / "Failed to construct 'Worker'"**
```bash
# Problem: Accessing via file:// protocol
file:///Users/.../index.html  ❌

# Solution: Use HTTP server
http://localhost:8000  ✅
```

**Q: CSV parsing fails / "Column not found"**
```javascript
// Problem: Exact column name mismatch
CSV has: "签单保费"
Config expects: "保费收入"  ❌

// Solution: Add to csvFields array
"csvFields": ["保费收入", "保费", "premium", "签单保费"]  ✅
```

**Q: Filters don't apply**
```
Problem: User selected values but charts didn't update
Cause: Forgot to click "应用筛选" button (draft → applied pattern)
Solution: Click blue "应用筛选" button after selecting values
```

**Q: Charts not rendering**
```javascript
// Check ECharts CDN loaded
console.log(window.echarts);  // Should not be undefined

// Check chart container exists
document.getElementById('monthly-trend-chart');  // Should not be null

// Check data structure
EventBus.emit('data-filtered', { validData: [...] });  // Must have validData array
```

**Q: Memory leak over time**
```javascript
// Problem: Multiple listeners on Worker
worker.addEventListener('message', handler);  // Called multiple times ❌

// Solution: Use WorkerBridge (auto-cleanup)
WorkerBridge.sendMessage('action', data, handler);  // One-time listener ✅
```

---

## 🎨 Design System

### McKinsey Theme Colors

**Primary Colors** (themes.css:1-20):
- **Brand Red**: `#a02724` (buttons, accents)
- **Dark Gray**: `#2c2c2c` (headings)
- **Medium Gray**: `#666` (body text)
- **Light Gray**: `#f5f5f5` (backgrounds)

**Dimension Colors** (auto-assigned from config):
- 三级机构: `#0070c0` (Blue)
- 起保月: `#00b050` (Green)
- 客户类别: `#ff0000` (Red)
- See `config/dimensions.json` for full palette

**Chart Colors** (ECharts):
- Primary series: `#0070c0`
- Accent series: `#a02724`
- Grid lines: `#e0e0e0`

---

## 🚀 Development Workflow

### Adding New Features

**Typical Flow**:
1. **Understand Request**: Read user requirement
2. **Check Config**: Can it be done via JSON config change?
3. **If Config Change**: Update `config/*.json`, test, commit
4. **If Code Change**: Follow component pattern
   - Add component in `js/components/`
   - Emit/subscribe to EventBus events
   - Update `js/app.js` to initialize component
5. **If Worker Logic**: Modify `js/workers/data.worker.js`
6. **Test**: Load sample Excel, verify functionality
7. **Commit**: Clear commit message

### Testing Checklist

Before committing changes:
- [ ] Test with sample Excel file (2,356 rows)
- [ ] Verify filters apply correctly (draft → applied)
- [ ] Check charts render with filtered data
- [ ] Test CSV export (if modified exporter)
- [ ] Verify no console errors
- [ ] Test in Chrome, Firefox, Safari

---

## 🔗 Related Projects

**Based on autowrKPI Architecture**:
- Location: `/Users/xuechenglong/Downloads/autowrKPI`
- Key learnings applied:
  - Web Worker data processing pattern
  - E-commerce style dimension selector
  - McKinsey visual design system
  - Configuration-driven dimension system

**Key Differences from autowrKPI**:
- **No KPI definitions** (pure data exploration)
- **Single metric focus** (保费收入 only)
- **No chart presets** (dynamic grouping)
- **Simplified export** (CSV only, no Excel formatting)

---

## 📊 Future Enhancements

**Planned Features** (not yet implemented):
- [ ] 4-tab layout (概览/趋势/对比/交叉)
- [ ] Stacked bar charts (cross-dimensional analysis)
- [ ] localStorage persistence (filter state)
- [ ] Excel export with formatting
- [ ] Date range picker (for 起保月)

**When implementing these**:
- Start with config changes (if applicable)
- Maintain draft → applied pattern
- Keep Worker processing for heavy operations
- Use EventBus for new component communication

---

**Maintainers**: Development Team
**License**: MIT
**Created**: 2025-12-26
**Architecture Reference**: autowrKPI
**Related**: `README.md` | `ACTION_PLAN.md` | `DEPLOYMENT_STATUS.md`
