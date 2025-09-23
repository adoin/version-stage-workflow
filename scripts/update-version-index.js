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
              path: dir.name  // 版本路径 (如: v1.0.0)
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
  // 创建重定向到最新版本的页面
  const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>版本归档 - 重定向中...</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .loading-container {
            text-align: center;
            color: white;
            background: rgba(255, 255, 255, 0.1);
            padding: 40px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .version-list {
            margin-top: 30px;
            text-align: left;
        }
        .version-item {
            margin: 10px 0;
        }
        .version-item a {
            color: white;
            text-decoration: none;
            padding: 8px 12px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            display: inline-block;
            transition: all 0.2s ease;
        }
        .version-item a:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        .latest {
            background: rgba(40, 167, 69, 0.3);
        }
    </style>
</head>
<body>
    <div class="loading-container">
        <div class="spinner"></div>
        <h2>🚀 正在重定向到最新版本...</h2>
        <p>如果没有自动跳转，请手动选择版本：</p>
        
        <div class="version-list">
            ${versionIndex.versions.map(version => `
                <div class="version-item">
                    <a href="${version.path}/" ${version.cleanVersion === versionIndex.latest?.cleanVersion ? 'class="latest"' : ''}>
                        ${version.version} ${version.cleanVersion === versionIndex.latest?.cleanVersion ? '(最新)' : ''}
                    </a>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        // 自动重定向到最新版本
        const latestVersion = ${JSON.stringify(versionIndex.latest)};
        
        if (latestVersion) {
            console.log('🔄 重定向到最新版本:', latestVersion.version);
            
            // 延迟 1 秒后重定向，给用户看到加载页面
            setTimeout(() => {
                window.location.href = latestVersion.path + '/';
            }, 1000);
        } else {
            document.querySelector('.loading-container h2').textContent = '❌ 未找到可用版本';
            document.querySelector('.spinner').style.display = 'none';
        }
    </script>
</body>
</html>`;

  const indexPath = path.join(archiveDir, 'index.html');
  fs.writeFileSync(indexPath, indexHtml);
  
  console.log(`📄 生成版本重定向页面: index.html`);
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
