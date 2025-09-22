#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const semver = require('semver');

/**
 * 更新版本索引脚本
 * 维护版本列表和最新版本信息
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

function updateVersionIndex(archiveDir, newVersion) {
  console.log(`📝 更新版本索引: ${newVersion}`);

  const indexPath = path.join(archiveDir, 'index.json');
  let versionIndex = { versions: [], latest: null, updated: null };

  // 读取现有索引
  if (fs.existsSync(indexPath)) {
    try {
      versionIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    } catch (error) {
      console.warn('⚠️  无法读取现有索引，创建新索引');
    }
  }

  // 扫描所有版本目录
  const versions = [];
  if (fs.existsSync(archiveDir)) {
    const dirs = fs.readdirSync(archiveDir, { withFileTypes: true });
    
    for (const dir of dirs) {
      if (dir.isDirectory() && dir.name !== '.git') {
        const versionDir = path.join(archiveDir, dir.name);
        const metadataPath = path.join(versionDir, 'version-metadata.json');
        
        if (fs.existsSync(metadataPath)) {
          try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
            versions.push({
              version: metadata.version,
              cleanVersion: metadata.cleanVersion,
              timestamp: metadata.timestamp,
              commit: metadata.commit,
              buildDate: metadata.buildDate,
              buildTime: metadata.buildTime,
              path: dir.name
            });
          } catch (error) {
            console.warn(`⚠️  无法读取版本元数据: ${dir.name}`);
          }
        }
      }
    }
  }

  // 按版本号排序（最新版本在前）
  versions.sort((a, b) => {
    const aVersion = semver.valid(semver.coerce(a.cleanVersion));
    const bVersion = semver.valid(semver.coerce(b.cleanVersion));
    
    if (aVersion && bVersion) {
      return semver.rcompare(aVersion, bVersion);
    }
    
    // 如果无法解析为语义版本，按字符串倒序排列
    return b.cleanVersion.localeCompare(a.cleanVersion);
  });

  // 更新索引
  versionIndex.versions = versions;
  versionIndex.latest = versions[0] || null;
  versionIndex.updated = new Date().toISOString();
  versionIndex.count = versions.length;

  // 写入索引文件
  fs.writeFileSync(indexPath, JSON.stringify(versionIndex, null, 2));

  // 创建简化的版本列表（用于前端快速加载）
  const simpleIndex = {
    versions: versions.map(v => ({
      version: v.version,
      cleanVersion: v.cleanVersion,
      buildDate: v.buildDate,
      path: v.path
    })),
    latest: versionIndex.latest ? {
      version: versionIndex.latest.version,
      cleanVersion: versionIndex.latest.cleanVersion,
      path: versionIndex.latest.path
    } : null,
    count: versions.length
  };

  const simpleIndexPath = path.join(archiveDir, 'versions.json');
  fs.writeFileSync(simpleIndexPath, JSON.stringify(simpleIndex, null, 2));

  console.log(`✅ 版本索引更新完成！`);
  console.log(`📊 总版本数: ${versions.length}`);
  console.log(`🏷️  最新版本: ${versionIndex.latest?.version || 'none'}`);

  // 生成版本切换器主页
  generateVersionSwitcherPage(archiveDir, simpleIndex);
}

function generateVersionSwitcherPage(archiveDir, versionIndex) {
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>版本归档 - Version Archive</title>
    <link rel="stylesheet" href="version-switcher.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .version-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .version-card {
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        .version-card:hover {
            border-color: #0366d6;
            box-shadow: 0 4px 12px rgba(3,102,214,0.15);
        }
        .version-title {
            font-size: 18px;
            font-weight: 600;
            color: #0366d6;
            margin-bottom: 10px;
        }
        .version-info {
            color: #586069;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .version-link {
            display: inline-block;
            background: #0366d6;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            transition: background 0.3s ease;
        }
        .version-link:hover {
            background: #0256cc;
        }
        .latest-badge {
            background: #28a745;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗂️ 版本归档中心</h1>
            <p>管理和切换不同版本的构建产物</p>
            <p><strong>总版本数:</strong> ${versionIndex.count} | <strong>最新版本:</strong> ${versionIndex.latest?.version || 'none'}</p>
        </div>

        <div class="version-grid">
            ${versionIndex.versions.map(version => `
                <div class="version-card">
                    <div class="version-title">
                        ${version.version}
                        ${version.cleanVersion === versionIndex.latest?.cleanVersion ? '<span class="latest-badge">最新</span>' : ''}
                    </div>
                    <div class="version-info">
                        构建日期: ${version.buildDate}
                    </div>
                    <a href="${version.path}/" class="version-link">访问此版本</a>
                </div>
            `).join('')}
        </div>
    </div>

    <div id="version-switcher"></div>
    <script src="version-switcher.js"></script>
</body>
</html>`;

  const indexPath = path.join(archiveDir, 'index.html');
  fs.writeFileSync(indexPath, indexHtml);
  
  console.log(`📄 生成版本切换器主页: index.html`);
}

// 主执行逻辑
if (require.main === module) {
  const args = parseArgs();
  
  if (!args.archiveDir || !args.version) {
    console.error('❌ 缺少必要参数');
    console.log('用法: node update-version-index.js --archive-dir=archive/versions --version=v1.0.0');
    process.exit(1);
  }

  updateVersionIndex(args.archiveDir, args.version);
}

module.exports = { updateVersionIndex };
