#!/usr/bin/env node

/**
 * 简单的构建脚本
 * 模拟真实项目的构建过程
 */

const fs = require('fs');
const path = require('path');

console.log('🔨 开始构建测试项目...');

// 创建构建目录
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 读取 package.json 获取版本号
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const version = packageJson.version;

console.log(`📦 构建版本: v${version}`);

// 读取并处理 HTML 文件
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// 更新版本号
html = html.replace(/v\d+\.\d+\.\d+/g, `v${version}`);
html = html.replace(/window\.currentVersion = '[^']*'/, `window.currentVersion = '${version}'`);

// 添加构建时间戳
const buildTime = new Date().toLocaleString('zh-CN');
html = html.replace(
    '页面生成时间: \' + new Date().toLocaleString(\'zh-CN\')',
    `构建时间: ${buildTime}`
);

// 写入构建目录
fs.writeFileSync(path.join(distDir, 'index.html'), html);

// 创建一些示例静态资源
const assetsDir = path.join(distDir, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

// 创建示例 CSS 文件
const css = `
/* 构建生成的 CSS - v${version} */
.build-info {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
}
.build-info::before {
    content: "构建版本: v${version}";
}
`;
fs.writeFileSync(path.join(assetsDir, 'style.css'), css);

// 创建示例 JS 文件
const js = `
// 构建生成的 JS - v${version}
console.log('🚀 项目版本: v${version}');
console.log('🕒 构建时间: ${buildTime}');

// 添加构建信息到页面
document.addEventListener('DOMContentLoaded', function() {
    const buildInfo = document.createElement('div');
    buildInfo.className = 'build-info';
    buildInfo.innerHTML = '构建版本: v${version}<br>构建时间: ${buildTime}';
    document.body.appendChild(buildInfo);
});
`;
fs.writeFileSync(path.join(assetsDir, 'app.js'), js);

// 更新 HTML 文件以包含这些资源
html = html.replace('</head>', `
    <link rel="stylesheet" href="assets/style.css">
</head>`);

html = html.replace('</body>', `
    <script src="assets/app.js"></script>
</body>`);

fs.writeFileSync(path.join(distDir, 'index.html'), html);

// 创建构建清单
const manifest = {
    version: `v${version}`,
    buildTime: buildTime,
    files: [
        'index.html',
        'assets/style.css',
        'assets/app.js'
    ],
    size: {
        'index.html': fs.statSync(path.join(distDir, 'index.html')).size,
        'assets/style.css': fs.statSync(path.join(assetsDir, 'style.css')).size,
        'assets/app.js': fs.statSync(path.join(assetsDir, 'app.js')).size
    }
};

fs.writeFileSync(path.join(distDir, 'build-manifest.json'), JSON.stringify(manifest, null, 2));

console.log('✅ 构建完成!');
console.log(`📁 输出目录: ${distDir}`);
console.log(`📄 文件数量: ${manifest.files.length}`);
console.log('📋 构建清单:', JSON.stringify(manifest, null, 2));
