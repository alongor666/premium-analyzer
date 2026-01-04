#!/usr/bin/env node

/**
 * AI协作治理规范校验脚本
 *
 * 功能:
 * 1. 检查根目录文件存在性
 * 2. 检查三大索引存在性
 * 3. 检查核心层目录INDEX.md
 * 4. 验证BACKLOG.md中DONE条目的完整性
 *
 * 使用方法:
 * node scripts/check-governance.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

// ANSI颜色代码
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// 日志函数
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(path.join(projectRoot, filePath));
}

// 读取文件内容
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(projectRoot, filePath), 'utf-8');
  } catch (error) {
    return null;
  }
}

// 检查根目录文件
function checkRootFiles() {
  log('\n📁 检查根目录文件...', colors.blue);

  const requiredFiles = [
    'CLAUDE.md',
    'AGENTS.md',
    'BACKLOG.md',
    'PROGRESS.md',
  ];

  const optionalFiles = [
    'project_rules.md',
    'GEMINI.md',
  ];

  let passed = 0;
  let total = requiredFiles.length;

  const results = [];

  for (const file of requiredFiles) {
    const exists = fileExists(file);
    results.push({ file, exists, required: true });
    if (exists) passed++;
  }

  for (const file of optionalFiles) {
    const exists = fileExists(file);
    results.push({ file, exists, required: false });
    if (exists) total++;
  }

  for (const result of results) {
    const { file, exists, required } = result;
    if (exists) {
      log(`  ✅ ${file}`, colors.green);
    } else if (required) {
      log(`  ❌ ${file} (必需)`, colors.red);
    } else {
      log(`  ⚠️  ${file} (可选)`, colors.yellow);
    }
  }

  return { passed, total, results };
}

// 检查三大索引
function checkIndexFiles() {
  log('\n📊 检查三大索引文件...', colors.blue);

  const indexFiles = [
    'docs/00_index/DOC_INDEX.md',
    'docs/00_index/CODE_INDEX.md',
    'docs/00_index/PROGRESS_INDEX.md',
  ];

  let passed = 0;
  const results = [];

  for (const file of indexFiles) {
    const exists = fileExists(file);
    results.push({ file, exists });
    if (exists) {
      log(`  ✅ ${file}`, colors.green);
      passed++;
    } else {
      log(`  ❌ ${file}`, colors.red);
    }
  }

  return { passed, total: indexFiles.length, results };
}

// 检查核心层目录INDEX.md
function checkCoreDirectoryIndexes() {
  log('\n🏗️  检查核心层目录INDEX.md...', colors.blue);

  const coreDirectories = [
    'js/core/INDEX.md',
    'js/components/INDEX.md',
    'js/utils/INDEX.md',
    'js/workers/INDEX.md',
    'js/services/INDEX.md',
    'config/INDEX.md',
    'css/INDEX.md',
  ];

  let passed = 0;
  const results = [];

  for (const file of coreDirectories) {
    const exists = fileExists(file);
    results.push({ file, exists });
    if (exists) {
      log(`  ✅ ${file}`, colors.green);
      passed++;
    } else {
      log(`  ❌ ${file}`, colors.red);
    }
  }

  return { passed, total: coreDirectories.length, results };
}

// 验证BACKLOG.md中DONE条目
function checkBacklogDonERules() {
  log('\n📋 验证BACKLOG.md中DONE条目...', colors.blue);

  const content = readFile('BACKLOG.md');
  if (!content) {
    log('  ❌ BACKLOG.md不存在', colors.red);
    return { passed: 0, total: 0, results: [] };
  }

  // 提取DONE条目
  const doneSections = content.match(/####[^]*?\n- \*\*ID\*:[^]*?\n- \*\*状态\*:\s*✅ DONE/g) || [];

  let passed = 0;
  const results = [];

  for (const section of doneSections) {
    const idMatch = section.match(/- \*\*ID\*:\s*(\S+)/);
    const id = idMatch ? idMatch[1] : 'UNKNOWN';

    // 检查三要素
    const hasDoc = section.includes('- **关联文档**:');
    const hasCode = section.includes('- **关联代码**:');
    const hasEvidence = section.includes('- **验收证据**:');

    const isValid = hasDoc && hasCode && (hasEvidence || section.includes('N/A'));

    results.push({ id, hasDoc, hasCode, hasEvidence, isValid });

    if (isValid) {
      log(`  ✅ ${id} - 三要素完整`, colors.green);
      passed++;
    } else {
      log(`  ❌ ${id} - 缺少${!hasDoc ? '文档' : ''}${!hasCode ? '代码' : ''}${!hasEvidence ? '证据' : ''}`, colors.red);
    }
  }

  return { passed, total: doneSections.length, results };
}

// 生成报告
function generateReport(results) {
  log('\n' + '='.repeat(60), colors.blue);
  log('📊 治理校验报告', colors.blue);
  log('='.repeat(60), colors.blue);

  const { rootFiles, indexFiles, coreDirectories, backlogDone } = results;

  const totalPassed = rootFiles.passed + indexFiles.passed + coreDirectories.passed + backlogDone.passed;
  const totalTotal = rootFiles.total + indexFiles.total + coreDirectories.total + backlogDone.total;
  const percentage = totalTotal > 0 ? ((totalPassed / totalTotal) * 100).toFixed(1) : 0;

  if (totalPassed === totalTotal) {
    log('\n✅ 治理校验通过!', colors.green);
  } else {
    log('\n❌ 治理校验失败', colors.red);
  }

  log(`\n统计信息:`, colors.blue);
  log(`  - 根目录文件: ${rootFiles.passed}/${rootFiles.total} 通过`);
  log(`  - 索引文件: ${indexFiles.passed}/${indexFiles.total} 通过`);
  log(`  - 核心目录: ${coreDirectories.passed}/${coreDirectories.total} 通过`);
  log(`  - BACKLOG条目: ${backlogDone.passed}/${backlogDone.total} 通过`);
  log(`\n总体通过率: ${percentage}%`, colors.blue);

  // 详细错误
  if (totalPassed < totalTotal) {
    log('\n🔍 详细错误:', colors.yellow);

    if (rootFiles.passed < rootFiles.total) {
      log('\n根目录文件缺失:', colors.yellow);
      rootFiles.results.filter(r => !r.exists && r.required).forEach(r => {
        log(`  - ${r.file}`, colors.red);
      });
    }

    if (indexFiles.passed < indexFiles.total) {
      log('\n索引文件缺失:', colors.yellow);
      indexFiles.results.filter(r => !r.exists).forEach(r => {
        log(`  - ${r.file}`, colors.red);
      });
    }

    if (coreDirectories.passed < coreDirectories.total) {
      log('\n核心目录索引缺失:', colors.yellow);
      coreDirectories.results.filter(r => !r.exists).forEach(r => {
        log(`  - ${r.file}`, colors.red);
      });
    }

    if (backlogDone.passed < backlogDone.total) {
      log('\nBACKLOG条目不完整:', colors.yellow);
      backlogDone.results.filter(r => !r.isValid).forEach(r => {
        log(`  - ${r.id}`, colors.red);
      });
    }
  }

  log('\n' + '='.repeat(60), colors.blue);

  // 返回退出码
  return totalPassed === totalTotal ? 0 : 1;
}

// 主函数
function main() {
  log('\n🔍 开始治理校验...', colors.blue);

  const rootFiles = checkRootFiles();
  const indexFiles = checkIndexFiles();
  const coreDirectories = checkCoreDirectoryIndexes();
  const backlogDone = checkBacklogDonERules();

  const exitCode = generateReport({
    rootFiles,
    indexFiles,
    coreDirectories,
    backlogDone,
  });

  process.exit(exitCode);
}

// 执行
main();
