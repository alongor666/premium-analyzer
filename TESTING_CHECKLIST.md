# ✅ XSS修复验证清单

## 测试环境
- **服务器地址**: http://localhost:8000
- **测试文件**: test-xss.csv
- **测试时间**: 2025-12-29

---

## 🧪 手动测试步骤

### 1. 基础功能测试
- [ ] 应用正常启动,无控制台错误
- [ ] 上传正常Excel/CSV文件成功
- [ ] 数据解析和显示正常
- [ ] 维度筛选器正常工作
- [ ] 图表渲染正常

### 2. XSS攻击测试 (使用test-xss.csv)

#### 测试用例1: script标签注入
**Payload**: `<script>alert('XSS in organization')</script>`
- [ ] 上传test-xss.csv文件
- [ ] 查看明细数据表 → 应显示为纯文本,不执行
- [ ] 查看三级机构筛选器 → 选项显示为纯文本
- [ ] 应用该筛选 → 标签显示为转义文本
- [ ] **预期**: 无alert弹出,代码显示为文本

#### 测试用例2: img标签onerror注入
**Payload**: `<img src=x onerror="alert('XSS in customer')">`
- [ ] 在客户类别筛选器中查看
- [ ] 鼠标悬停在该选项上
- [ ] **预期**: 无alert弹出,属性被正确转义

#### 测试用例3: iframe标签注入
**Payload**: `<iframe src="javascript:alert('XSS')"></iframe>`
- [ ] 在能源类型筛选器中查看
- [ ] 应用筛选后查看标签
- [ ] **预期**: 标签显示为纯文本,无iframe渲染

#### 测试用例4: SVG onload注入
**Payload**: `<svg onload=alert('XSS')>`
- [ ] 在险别组合筛选器中查看
- [ ] **预期**: 代码被转义,不执行

#### 测试用例5: 属性注入
**Payload**: `"天府""onmouseover=""alert('XSS')`
- [ ] 在三级机构筛选器中查看
- [ ] 鼠标移到该选项上
- [ ] **预期**: 无alert弹出,引号被转义

### 3. 边界情况测试
- [ ] 空值处理正常
- [ ] 特殊字符(<, >, &, ", ')正确转义
- [ ] Unicode字符正确显示
- [ ] 超长文本正常处理

### 4. 性能测试
- [ ] 大文件上传不卡顿
- [ ] 筛选响应速度正常
- [ ] 内存使用正常

---

## 🔍 自动化测试建议

### 单元测试
```javascript
// 测试escapeHtml函数
test('escapeHtml escapes dangerous characters', () => {
  expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  expect(escapeHtml('"')).toBe('&quot;');
  expect(escapeHtml("'")).toBe('&#039;');
});

// 测试XSS防护
test('renderDetailTable escapes user input', () => {
  const maliciousData = [
    { dimension: '<script>alert("XSS")</script>', premium: 1000, ratio: 0.5, count: 1 }
  ];
  const container = document.createElement('div');
  // 调用renderDetailTable
  expect(container.innerHTML).not.toContain('<script>');
});
```

### 集成测试
```javascript
test('XSS payload does not execute when uploaded', async () => {
  const maliciousCsv = createMaliciousCsv();
  await uploadFile(maliciousCsv);

  const windowAlert = spyOn(window, 'alert');
  expect(windowAlert).not.toHaveBeenCalled();
});
```

---

## ✅ 验证标准

### 通过条件
- 所有测试用例通过
- 无alert对话框弹出
- 控制台无XSS相关错误
- 恶意代码显示为纯文本
- 正常功能不受影响

### 失败条件
- 出现alert弹窗
- JavaScript代码被执行
- DOM被恶意修改
- 控制台有安全错误

---

## 📊 测试报告模板

```
测试日期: ___________
测试人员: ___________
测试环境: Chrome/Firefox/Safari版本___________

| 测试项 | 结果 | 备注 |
|--------|------|------|
| script标签注入 | ☐通过 ☐失败 |  |
| img标签注入 | ☐通过 ☐失败 |  |
| iframe标签注入 | ☐通过 ☐失败 |  |
| SVG注入 | ☐通过 ☐失败 |  |
| 属性注入 | ☐通过 ☐失败 |  |
| 空值处理 | ☐通过 ☐失败 |  |
| 特殊字符 | ☐通过 ☐失败 |  |
| Unicode字符 | ☐通过 ☐失败 |  |

总体评估: ☐通过 ☐失败

问题记录:
_________________________________
_________________________________
_________________________________
```

---

## 🚨 发现问题时

如果发现XSS漏洞仍然存在:

1. **立即停止使用该功能**
2. **记录重现步骤**
3. **检查浏览器控制台错误**
4. **验证security.js是否正确加载**
5. **验证转义函数是否被调用**

**调试命令** (浏览器控制台):
```javascript
// 检查安全工具是否加载
console.log(window.SecurityUtils);

// 测试转义函数
console.log(SecurityUtils.escapeHtml('<script>alert("test")</script>'));
// 应输出: &lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;

// 检查DOM内容
document.querySelectorAll('.filter-tag-values').forEach(el => {
  console.log(el.textContent); // 应该显示转义后的文本
});
```

---

**最后更新**: 2025-12-29
**版本**: 1.0.0
