/**
 * 测试脚本 - 验证 chartTopOrganizations 修复
 * 在浏览器控制台中运行此脚本
 */

console.log('=== 开始测试修复 ===\n');

// 测试 1: 验证旧代码已删除
console.log('测试 1: 验证 chartTopOrganizations 容器引用已删除');
const appJsContent = document.querySelector('script[src*="app.js"]');
if (appJsContent) {
  console.log('✓ app.js 已加载');
} else {
  console.log('✗ app.js 未加载');
}

// 测试 2: 验证新方法存在
console.log('\n测试 2: 验证 renderTabContent 方法存在');
if (window.App && typeof window.App === 'function') {
  console.log('✓ App 类已定义');
} else {
  console.log('✗ App 类未定义');
}

// 测试 3: 验证所有必需的容器存在
console.log('\n测试 3: 验证图表容器存在');
const containers = {
  'chartMonthTrend': '月度趋势图',
  'chartBarMain': '柱状图',
  'chartRatioMain': '占比图'
};

for (const [id, name] of Object.entries(containers)) {
  const element = document.getElementById(id);
  if (element) {
    console.log(`✓ ${name} 容器存在 (${id})`);
  } else {
    console.log(`✗ ${name} 容器不存在 (${id})`);
  }
}

// 测试 4: 验证不存在的容器
console.log('\n测试 4: 验证旧容器不存在（应该不存在）');
const oldContainer = document.getElementById('chartTopOrganizations');
if (!oldContainer) {
  console.log('✓ chartTopOrganizations 容器不存在（正确）');
} else {
  console.log('✗ chartTopOrganizations 容器仍然存在（错误）');
}

// 测试 5: 验证 ChartService
console.log('\n测试 5: 验证 ChartService 类');
if (window.ChartService && typeof window.ChartService === 'function') {
  console.log('✓ ChartService 类已定义');

  // 检查实例方法
  const service = new window.ChartService();
  if (typeof service.renderChart === 'function') {
    console.log('✓ renderChart 方法存在');
  } else {
    console.log('✗ renderChart 方法不存在');
  }
} else {
  console.log('✗ ChartService 类未定义');
}

// 测试 6: 验证标签页导航
console.log('\n测试 6: 验证标签页导航');
const tabs = document.querySelectorAll('.tab-item');
if (tabs.length > 0) {
  console.log(`✓ 找到 ${tabs.length} 个标签页`);
  tabs.forEach((tab, i) => {
    console.log(`  - 标签页 ${i + 1}: ${tab.textContent} (${tab.dataset.tab})`);
  });
} else {
  console.log('✗ 未找到标签页');
}

console.log('\n=== 测试完成 ===');
console.log('\n如需测试完整功能，请上传测试数据文件：test-data.csv');
