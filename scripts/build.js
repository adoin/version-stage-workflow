#!/usr/bin/env node

/**
 * 版本归档工具构建脚本
 * 用于准备发布版本
 */

const fs = require('fs');
const path = require('path');

console.log('🔨 构建版本归档工具...');

// 创建构建目录
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 复制核心文件
const filesToCopy = [
    { src: 'src/version-switcher.js', dest: 'version-switcher.js' },
    { src: 'src/version-switcher.css', dest: 'version-switcher.css' },
    { src: 'scripts/archive-version.js', dest: 'scripts/archive-version.js' },
    { src: 'scripts/update-version-index.js', dest: 'scripts/update-version-index.js' },
    { src: '.github/workflows/version-archive.yml', dest: 'workflows/version-archive.yml' },
    { src: 'package.json', dest: 'package.json' },
    { src: 'README.md', dest: 'README.md' },
    { src: 'docs/usage.md', dest: 'docs/usage.md' }
];

// 创建必要的子目录
fs.mkdirSync(path.join(distDir, 'scripts'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'workflows'), { recursive: true });
fs.mkdirSync(path.join(distDir, 'docs'), { recursive: true });

filesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(__dirname, '..', src);
    const destPath = path.join(distDir, dest);
    
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ 复制: ${src} -> ${dest}`);
    } else {
        console.warn(`⚠️  文件不存在: ${src}`);
    }
});

// 创建发布包清单
const manifest = {
    name: 'version-stage-workflow',
    version: JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')).version,
    buildTime: new Date().toISOString(),
    files: filesToCopy.map(f => f.dest),
    description: 'GitHub workflow for version-based artifact archiving and version switching'
};

fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('✅ 构建完成!');
console.log(`📁 输出目录: ${distDir}`);
console.log(`📦 版本: ${manifest.version}`);
console.log(`📄 文件数量: ${manifest.files.length}`);
