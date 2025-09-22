#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 版本归档脚本
 * 将构建产物按版本号归档到指定目录
 */

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.split('=');
    args[key.replace('--', '')] = value || true;
  });
  return args;
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`❌ 源目录不存在: ${src}`);
    process.exit(1);
  }

  // 创建目标目录
  fs.mkdirSync(dest, { recursive: true });

  // 递归复制文件
  const items = fs.readdirSync(src);
  items.forEach(item => {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function archiveVersion(options) {
  const {
    version,
    cleanVersion,
    buildDir,
    archiveDir,
    force = 'false'
  } = options;

  console.log(`🚀 开始归档版本: ${version}`);
  console.log(`📁 构建目录: ${buildDir}`);
  console.log(`📦 归档目录: ${archiveDir}`);

  // 检查构建目录是否存在
  if (!fs.existsSync(buildDir)) {
    console.error(`❌ 构建目录不存在: ${buildDir}`);
    process.exit(1);
  }

  // 创建版本归档目录
  const versionDir = path.join(archiveDir, cleanVersion);
  
  // 检查版本是否已存在
  if (fs.existsSync(versionDir) && force !== 'true') {
    console.error(`❌ 版本 ${version} 已存在，使用 --force=true 强制覆盖`);
    process.exit(1);
  }

  // 删除已存在的版本目录（如果强制覆盖）
  if (fs.existsSync(versionDir) && force === 'true') {
    console.log(`🗑️  删除已存在的版本: ${version}`);
    fs.rmSync(versionDir, { recursive: true, force: true });
  }

  // 复制构建产物到版本目录
  console.log(`📋 复制构建产物到: ${versionDir}`);
  copyDirectory(buildDir, versionDir);

  // 创建版本元数据
  const metadata = {
    version: version,
    cleanVersion: cleanVersion,
    timestamp: new Date().toISOString(),
    commit: process.env.GITHUB_SHA || 'unknown',
    buildDate: new Date().toLocaleDateString('zh-CN'),
    buildTime: new Date().toLocaleTimeString('zh-CN')
  };

  const metadataPath = path.join(versionDir, 'version-metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  // 创建版本切换器注入脚本
  const injectorScript = `
(function() {
  // 版本切换器自动注入脚本
  if (typeof window !== 'undefined' && !window.versionSwitcherInjected) {
    window.versionSwitcherInjected = true;
    window.currentVersion = '${cleanVersion}';
    
    // 动态加载版本切换器
    const script = document.createElement('script');
    script.src = '../version-switcher.js';
    script.async = true;
    document.head.appendChild(script);
    
    // 加载样式
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../version-switcher.css';
    document.head.appendChild(link);
  }
})();
`;

  const injectorPath = path.join(versionDir, 'version-injector.js');
  fs.writeFileSync(injectorPath, injectorScript);

  console.log(`✅ 版本 ${version} 归档成功！`);
  console.log(`📍 归档位置: ${versionDir}`);
}

// 主执行逻辑
if (require.main === module) {
  const args = parseArgs();
  
  if (!args.version || !args.buildDir || !args.archiveDir) {
    console.error('❌ 缺少必要参数');
    console.log('用法: node archive-version.js --version=v1.0.0 --clean-version=1.0.0 --build-dir=dist --archive-dir=archive/versions');
    process.exit(1);
  }

  archiveVersion(args);
}

module.exports = { archiveVersion };
