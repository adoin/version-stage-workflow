#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// const { execSync } = require('child_process'); // 暂未使用

/**
 * 版本归档脚本
 * 将构建产物按版本号归档到指定目录
 */

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, value] = arg.split('=');
    const cleanKey = key.replace('--', '').replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    args[cleanKey] = value || true;
  });
  return args;
}

function copyDirectory(src, dest, excludeDirs = []) {
  if (!fs.existsSync(src)) {
    console.error(`❌ 源目录不存在: ${src}`);
    process.exit(1);
  }

  // 创建目标目录
  fs.mkdirSync(dest, { recursive: true });

  // 递归复制文件
  const items = fs.readdirSync(src);
  items.forEach(item => {
    // 跳过排除的目录
    if (excludeDirs.includes(item)) {
      console.log(`⏭️  跳过排除目录: ${item}`);
      return;
    }

    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath, excludeDirs);
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

  // 解析绝对路径
  const absoluteBuildDir = path.resolve(buildDir);
  const absoluteArchiveDir = path.resolve(archiveDir);
  
  console.log(`🔍 解析后的构建目录: ${absoluteBuildDir}`);
  console.log(`🔍 解析后的归档目录: ${absoluteArchiveDir}`);

  // 检查构建目录是否存在
  if (!fs.existsSync(absoluteBuildDir)) {
    console.error(`❌ 构建目录不存在: ${absoluteBuildDir}`);
    console.error(`💡 当前工作目录: ${process.cwd()}`);
    console.error(`💡 传入的构建目录: ${buildDir}`);
    
    // 列出当前目录和上级目录的内容，帮助调试
    console.error(`📋 当前目录内容:`);
    try {
      fs.readdirSync('.').forEach(item => {
        const stat = fs.statSync(item);
        console.error(`   ${stat.isDirectory() ? '📁' : '📄'} ${item}`);
      });
    } catch (e) {
      console.error(`   无法读取当前目录: ${e.message}`);
    }
    
    console.error(`📋 上级目录内容:`);
    try {
      fs.readdirSync('..').forEach(item => {
        const stat = fs.statSync(path.join('..', item));
        console.error(`   ${stat.isDirectory() ? '📁' : '📄'} ${item}`);
      });
    } catch (e) {
      console.error(`   无法读取上级目录: ${e.message}`);
    }
    
    process.exit(1);
  }

  // 创建版本归档目录
  const versionDir = path.join(absoluteArchiveDir, cleanVersion);
  
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
  
  // 排除可能导致递归复制的目录
  const excludeDirs = [
    'archive',           // 归档目录本身
    'node_modules',      // Node.js 依赖
    '.git',              // Git 目录
    '.github',           // GitHub Actions 目录
    '.version-archive-tools', // 本工具目录
    'dist',              // 如果构建目录就是 dist，避免嵌套
    'build'              // 常见的构建目录名
  ];
  
  copyDirectory(absoluteBuildDir, versionDir, excludeDirs);

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

  // 修复 HTML 文件中的绝对路径
  console.log('🔧 修复 HTML 文件中的绝对路径...');
  fixAbsolutePaths(versionDir, options.pathPrefix);

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

// 修复HTML文件中的绝对路径
function fixAbsolutePaths(versionDir, pathPrefix = null) {
  const htmlFiles = findHTMLFiles(versionDir);
  
  console.log(`🔍 找到 ${htmlFiles.length} 个 HTML 文件需要检查路径`);
  
  let totalFilesFixed = 0;
  let totalPathsFixed = 0;
  let detectedPrefixes = new Set();
  
  htmlFiles.forEach(htmlFile => {
    try {
      // 先读取原始字节来检测编码
      const buffer = fs.readFileSync(htmlFile);
      let content;
      
      // 检测 UTF-16 LE BOM
      if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        content = buffer.toString('utf16le');
        console.log(`   📝 检测到 UTF-16LE 编码`);
      }
      // 检测 UTF-16 BE BOM  
      else if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        content = buffer.toString('utf16be');
        console.log(`   📝 检测到 UTF-16BE 编码`);
      }
      // 检测 UTF-8 BOM
      else if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        content = buffer.toString('utf8').slice(1); // 移除 BOM
        console.log(`   📝 检测到 UTF-8 BOM`);
      }
      // 默认 UTF-8
      else {
        content = buffer.toString('utf8');
        console.log(`   📝 使用默认 UTF-8 编码`);
      }
      
      console.log(`\n🔍 检查文件: ${path.relative(versionDir, htmlFile)}`);
      console.log(`📄 文件内容: ${content.substring(0, 200)}...`);
      
      // 如果没有指定路径前缀，先自动检测
      if (!pathPrefix) {
        const autoDetectPatterns = [
          // 检测 GitHub Pages 项目路径: /project-name/...
          /(?:href|src)=["']\/([\w.-]+)\/([^"']+)["']/g,
          // 检测 CSS 中的路径: url("/project-name/...")
          /url\(["']?\/([\w.-]+)\/([^"')]+)["']?\)/g
        ];
        
        autoDetectPatterns.forEach(pattern => {
          const matches = [...content.matchAll(pattern)];
          matches.forEach(match => {
            detectedPrefixes.add(match[1]); // 项目名称
          });
        });
      }
      
      let fileModified = false;
      let filePathsFixed = 0;
      
      if (pathPrefix) {
        // 使用手动指定的路径前缀
        console.log(`🎯 使用指定的路径前缀: /${pathPrefix}/`);
        // 使用字符串替换而不是复杂的正则表达式
        const prefixPattern = `/${pathPrefix}/`;
        console.log(`🔍 搜索模式: ${prefixPattern}`);
        
        if (content.includes(prefixPattern)) {
          console.log(`   ✅ 找到路径前缀: ${prefixPattern}`);
          
          // 简单的字符串替换
          const originalContent = content;
          content = content.replace(new RegExp(`href=["']\\/${pathPrefix}\\/`, 'g'), 'href="./');
          content = content.replace(new RegExp(`src=["']\\/${pathPrefix}\\/`, 'g'), 'src="./');
          content = content.replace(new RegExp(`url\\(["']?\\/${pathPrefix}\\/`, 'g'), 'url("./');
          
          if (content !== originalContent) {
            fileModified = true;
            filePathsFixed++;
          }
        } else {
          console.log(`   ❌ 未找到路径前缀: ${prefixPattern}`);
        }
      }
      
      // 处理自动检测的前缀
      if (!pathPrefix && detectedPrefixes.size > 0) {
        detectedPrefixes.forEach(prefix => {
          const prefixPattern = `/${prefix}/`;
          console.log(`🔍 自动检测前缀: ${prefixPattern}`);
          
          if (content.includes(prefixPattern)) {
            console.log(`   ✅ 找到路径前缀: ${prefixPattern}`);
            
            const originalContent = content;
            content = content.replace(new RegExp(`href=["']\\/${prefix}\\/`, 'g'), 'href="./');
            content = content.replace(new RegExp(`src=["']\\/${prefix}\\/`, 'g'), 'src="./');
            content = content.replace(new RegExp(`url\\(["']?\\/${prefix}\\/`, 'g'), 'url("./');
            
            if (content !== originalContent) {
              fileModified = true;
              filePathsFixed++;
            }
          }
        });
      }
      
      if (fileModified) {
        fs.writeFileSync(htmlFile, content);
        console.log(`   ✅ ${path.relative(versionDir, htmlFile)}: 修复了 ${filePathsFixed} 个路径`);
        totalFilesFixed++;
        totalPathsFixed += filePathsFixed;
      } else {
        console.log(`   ℹ️  ${path.relative(versionDir, htmlFile)}: 无需修复`);
      }
      
    } catch (error) {
      console.warn(`⚠️  处理 ${htmlFile} 时出错:`, error.message);
    }
  });
  
  if (totalPathsFixed > 0) {
    console.log(`✅ 路径修复完成: ${totalFilesFixed} 个文件，${totalPathsFixed} 个路径`);
  } else {
    console.log(`ℹ️  所有文件路径都正常，无需修复`);
  }
}

// 递归查找HTML文件
function findHTMLFiles(dir) {
  const files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...findHTMLFiles(fullPath));
      } else if (path.extname(item).toLowerCase() === '.html') {
        files.push(fullPath);
      }
    });
  } catch (error) {
    console.warn(`⚠️  读取目录 ${dir} 时出错:`, error.message);
  }
  
  return files;
}

module.exports = { archiveVersion };
