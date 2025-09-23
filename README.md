# Version Stage Workflow

一个可复用的 GitHub Actions 工作流节点，专门用于 Web 项目的版本化归档和版本切换功能。

## 功能特性

- 🏷️ **可复用工作流**：作为下级节点被其他项目调用，无需处理构建过程
- 🚀 **自动版本归档**：将已构建的产物按版本号归档到指定分支
- 🔗 **URL 路径切换**：每个版本独立 URL，SEO 友好，可直接分享
- 🔄 **版本切换UI**：美观的悬浮版本切换器，支持搜索和快速切换
- 📦 **多项目支持**：可被不同的 Web 项目复用，完全兼容 SSR 框架
- 🔍 **智能搜索**：支持版本号模糊搜索和快速切换
- 🌐 **GitHub Pages集成**：自动部署到 GitHub Pages，包含自动重定向
- ⚡ **高性能**：无 iframe 开销，直接 URL 跳转，支持浏览器缓存

## 设计理念

此工作流专门设计为 **下级节点**，专注于版本归档功能：

- ✅ **接收构建产物**：从调用方获取已构建的文件
- ✅ **版本管理**：自动检测或接收版本号
- ✅ **归档存储**：按版本组织和存储文件
- ✅ **UI注入**：自动添加版本切换功能
- ❌ **不处理构建**：不涉及依赖安装、编译等构建过程

## 快速开始

### 1. 确保项目有 package.json

版本号将自动从 `package.json` 的 `version` 字段获取：

```json
{
  "name": "your-project",
  "version": "1.2.35",
  "scripts": {
    "build": "your-build-command"
  }
}
```

### 2. 在您的项目中引用

```yaml
# .github/workflows/deploy.yml
name: Build and Archive

on:
  push:
    branches: [ main ]  # 推送到主分支时触发
  workflow_dispatch:   # 支持手动触发

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'pnpm'
    
    # 您的构建过程
    - run: pnpm install
    - run: pnpm build
    
    # 上传构建产物
    - uses: actions/upload-artifact@v4
      with:
        name: build-artifacts
        path: dist/  # 您的构建输出目录

  # 调用版本归档工作流
  archive:
    needs: build
    uses: your-username/version-stage-workflow/.github/workflows/version-archive.yml@main
    with:
      build_dir: 'dist'  # 您的构建输出目录
```

### 3. 本地开发测试

```bash
# 克隆项目
git clone https://github.com/your-username/version-stage-workflow.git
cd version-stage-workflow

# 安装依赖
pnpm install

# 构建测试项目
cd test && node build.js && cd ..

# 启动开发服务器
pnpm dev
# 访问 http://localhost:3000/test/
```

## 目录结构

```
version-stage-workflow/
├── .github/workflows/
│   └── version-archive.yml     # 主工作流文件
├── scripts/
│   ├── archive-version.js      # 版本归档脚本
│   ├── update-version-index.js # 版本索引更新脚本
│   ├── build.js               # 构建脚本
│   └── dev-server.js          # 开发服务器
├── src/
│   ├── version-switcher.js    # 版本切换器脚本
│   └── version-switcher.css   # 版本切换器样式
├── test/                      # 测试项目
├── docs/
│   └── usage.md              # 详细使用文档
└── package.json
```

## 配置参数

| 参数 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `build_dir` | ✅ | `dist` | 构建产物目录 |
| `version` | ❌ | 自动检测 | 版本号 |
| `archive_branch` | ❌ | `gh-pages` | 归档分支 |
| `force_archive` | ❌ | `false` | 强制覆盖 |
| `enable_pages` | ❌ | `true` | 部署到 Pages |

## 版本检测规则

1. 手动输入的 `version` 参数
2. Git 标签（如推送 v1.0.0 标签）
3. package.json 中的 version 字段
4. 默认值 v1.0.0

## 使用效果

归档完成后：
- 📁 每个版本独立存储在 `versions/1.0.0/` 目录
- 🏷️ 自动生成版本切换器UI（左上角）
- 🔍 支持版本搜索和快速切换
- 🌐 通过 GitHub Pages 在线访问

## 🏗️ 架构设计

### 📂 最终部署结构

```
GitHub Pages 根目录/
├── index.html                    # 主页面（自动重定向到最新版本）
├── versions.json                 # 版本索引文件
├── version-switcher.js           # 版本切换器脚本
├── version-switcher.css          # 版本切换器样式
├── v1.0.0/                       # 版本 1.0.0
│   ├── index.html                # 完整的站点文件
│   ├── assets/                   # 资源文件
│   └── version-injector.js       # 版本切换器注入脚本
└── v1.0.1/                       # 版本 1.0.1
    ├── index.html                # 完整的站点文件
    ├── assets/                   # 资源文件
    └── version-injector.js       # 版本切换器注入脚本
```

### 🔄 版本切换原理

1. **独立 URL**：每个版本都有独立的 URL 路径（如 `/v1.0.0/`、`/v1.0.1/`）
2. **自动重定向**：根目录自动重定向到最新版本
3. **URL 跳转**：点击版本切换器时，直接跳转到对应版本的 URL
4. **SEO 友好**：每个版本可独立分享，支持搜索引擎索引

### 🎨 自定义界面

- **重定向页面**：修改 `scripts/update-version-index.js` 中的主页模板
- **版本切换器**：编辑 `src/version-switcher.js` 和 `src/version-switcher.css`
- **响应式设计**：支持桌面端和移动端，完全兼容各种框架

## 详细文档

- [完整使用指南](docs/usage.md)
- [测试项目示例](test/)
- [GitHub Actions 工作流](.github/workflows/version-archive.yml)

## 许可证

MIT License
