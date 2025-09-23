# 版本归档工作流使用文档

## 概述

这是一个可复用的 GitHub Actions 工作流，专门用于将Web项目的构建产物按版本号进行归档，并提供版本切换功能。

## 主要功能

- 🏷️ **自动版本检测**：从Git标签、手动输入或package.json自动获取版本号
- 📦 **构建产物归档**：将已构建的静态文件按版本号归档到指定分支
- 🔄 **版本切换UI**：在页面左上角提供悬浮版本切换器
- 🔍 **智能搜索**：支持版本号模糊搜索和快速切换
- 🌐 **GitHub Pages集成**：自动部署到GitHub Pages

## 快速开始

### 1. 在您的项目中引用工作流

在您的项目中创建 `.github/workflows/deploy.yml`：

```yaml
name: Build and Archive

on:
  push:
    tags:
      - 'v*'  # 当推送版本标签时触发
  workflow_dispatch:
    inputs:
      version:
        description: '手动指定版本号'
        required: false

jobs:
  # 第一步：构建您的项目
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout 代码
      uses: actions/checkout@v4

    - name: 设置 Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: 安装依赖
      run: npm ci

    - name: 构建项目
      run: npm run build

    # 上传构建产物
    - name: 上传构建产物
      uses: actions/upload-artifact@v4
      with:
        name: build-artifacts
        path: dist/
        retention-days: 1

  # 第二步：调用版本归档工作流
  archive:
    needs: build
    uses: adoin/version-stage-workflow/.github/workflows/version-archive.yml@main
    with:
      build_dir: 'dist'              # 您的构建输出目录
      archive_branch: 'gh-pages'     # 归档分支（可选）
      archive_dir: 'versions'        # 归档目录（可选）
      force_archive: false           # 是否强制覆盖（可选）
      enable_pages: true             # 是否部署到GitHub Pages（可选）
    # 注意：GITHUB_TOKEN 由系统自动提供，无需手动传递
```

### 2. 配置 GitHub Pages

1. 进入您的 GitHub 仓库设置
2. 找到 "Pages" 设置
3. 选择 "Deploy from a branch"
4. 选择 "gh-pages" 分支和 "/ (root)" 目录
5. 点击保存

### 3. 发布版本

#### 方式一：自动触发（推荐）

```bash
# 1. 确保代码已提交并推送
git add .
git commit -m "准备发布 v1.0.0"
git push origin main

# 2. 创建并推送版本标签
git tag v1.0.0
git push origin v1.0.0
```

**自动执行**：推送标签后会自动触发构建和归档流程。

#### 方式二：手动触发

1. **GitHub界面操作**：
   - 进入仓库 → 点击 "Actions" 标签页
   - 选择 "Build and Archive" 工作流
   - 点击 "Run workflow" 按钮
   - 可选填写版本号（如 `v1.2.0`）

2. **参数说明**：
   - **留空版本号**：自动从 `package.json` 读取
   - **指定版本号**：使用自定义版本（如 `v1.2.0`）

## 配置参数

### 工作流输入参数

| 参数名 | 必需 | 默认值 | 说明 |
|--------|------|--------|------|
| `build_dir` | ✅ | `dist` | 构建产物目录（相对路径） |
| `version` | ❌ | 自动检测 | 版本号（如 v1.0.0） |
| `archive_branch` | ❌ | `gh-pages` | 归档分支名称 |
| `archive_dir` | ❌ | `versions` | 归档目录名称 |
| `force_archive` | ❌ | `false` | 是否强制覆盖已存在版本 |
| `enable_pages` | ❌ | `true` | 是否部署到 GitHub Pages |
| `path_prefix` | ❌ | `''` | 绝对路径前缀，留空自动检测 |

### 版本号检测规则

工作流按以下优先级检测版本号：

1. **手动输入**：`inputs.version` 参数
2. **Git标签**：推送的标签名（如 v1.0.0）
3. **package.json**：从 `version` 字段读取并添加 `v` 前缀
4. **默认值**：`v1.0.0`

## 目录结构

归档完成后，您的 `gh-pages` 分支将包含：

```
gh-pages/
├── versions/
│   ├── 1.0.0/              # 版本 v1.0.0 的构建产物
│   │   ├── index.html
│   │   ├── assets/
│   │   ├── version-metadata.json
│   │   └── version-injector.js
│   ├── 1.1.0/              # 版本 v1.1.0 的构建产物
│   ├── version-switcher.js  # 版本切换器脚本
│   ├── version-switcher.css # 版本切换器样式
│   ├── versions.json        # 版本索引（轻量）
│   ├── index.json          # 详细版本信息
│   └── index.html          # 版本归档主页
└── README.md
```

## 版本切换器

### 自动注入

版本切换器会自动注入到每个归档版本中：

- 位置：页面左上角
- 触发：鼠标悬停或点击
- 功能：搜索、切换版本

### 手动集成

如果需要在开发环境中测试版本切换器：

```html
<link rel="stylesheet" href="path/to/version-switcher.css">
<script>
  window.currentVersion = '1.0.0'; // 设置当前版本
</script>
<script src="path/to/version-switcher.js"></script>
```

## 高级用法

### 多个构建产物

如果您有多个构建输出目录：

```yaml
- name: 上传前端构建产物
  uses: actions/upload-artifact@v4
  with:
    name: frontend-build
    path: frontend/dist/

- name: 上传后端构建产物
  uses: actions/upload-artifact@v4
  with:
    name: backend-build
    path: backend/dist/

# 在归档 job 中下载并合并
- name: 下载构建产物
  uses: actions/download-artifact@v4
  with:
    name: frontend-build
    path: dist/
```

### 自定义版本格式

```yaml
- name: 生成自定义版本号
  id: version
  run: |
    VERSION="v$(date +%Y%m%d)-$(git rev-parse --short HEAD)"
    echo "version=$VERSION" >> $GITHUB_OUTPUT

- name: 调用版本归档
  uses: your-username/version-stage-workflow/.github/workflows/version-archive.yml@main
  with:
    version: ${{ steps.version.outputs.version }}
    build_dir: 'dist'
```

### 条件性归档

```yaml
archive:
  needs: build
  if: startsWith(github.ref, 'refs/tags/')  # 仅在推送标签时归档
  uses: your-username/version-stage-workflow/.github/workflows/version-archive.yml@main
```

## 故障排除

### 常见问题

1. **构建产物目录不存在**
   - 确保 `build_dir` 参数指向正确的构建输出目录
   - 确保构建 job 成功完成

2. **权限错误**
   - 确保 `GITHUB_TOKEN` 有足够权限
   - 检查仓库的 Actions 权限设置

3. **版本切换器不显示**
   - 检查浏览器控制台是否有 JavaScript 错误
   - 确保 `versions.json` 文件存在且格式正确

4. **GitHub Pages 未更新**
   - 检查 Pages 设置是否正确配置
   - 等待几分钟让 Pages 部署完成

### 调试技巧

1. **查看工作流日志**：在 GitHub Actions 页面查看详细执行日志

2. **检查归档分支**：切换到 `gh-pages` 分支查看文件结构

3. **本地测试**：
   ```bash
   # 克隆归档分支
   git clone -b gh-pages https://github.com/your-username/your-repo.git archive
   cd archive
   # 启动本地服务器
   python -m http.server 8000
   ```

## 示例项目

查看 `test/` 目录中的完整示例项目，包含：

- 示例 HTML 项目
- 构建脚本
- 完整的工作流配置

## 路径前缀配置

### 问题背景

不同项目的绝对路径前缀可能不同：
- GitHub Pages: `/repository-name/assets/...`
- Vite: `/project-name/assets/...`
- Next.js: `/basePath/assets/...`

### 配置方法

**方法一：自动检测**
```yaml
archive:
  uses: your-username/version-stage-workflow/.github/workflows/version-archive.yml@main
  with:
    build_dir: 'dist'
    # 不指定 path_prefix，自动检测
```

**方法二：手动指定**
```yaml
archive:
  uses: your-username/version-stage-workflow/.github/workflows/version-archive.yml@main
  with:
    build_dir: 'dist'
    path_prefix: 'my-project'  # 手动指定前缀
```

### 支持的路径类型

脚本会修复以下类型的绝对路径：

```html
<!-- HTML 属性 -->
<link href="/my-project/assets/style.css" rel="stylesheet">
<script src="/my-project/js/app.js"></script>
<img src="/my-project/images/logo.png">

<!-- CSS 中的 url() -->
<style>
  .bg { background: url('/project/images/bg.jpg'); }
</style>

<!-- 修复后都变为相对路径 -->
<link href="./assets/style.css" rel="stylesheet">
<script src="./js/app.js"></script>
<img src="./images/logo.png">
```

### 支持的资源目录

- `assets/` - 通用资源目录
- `js/`, `css/` - 脚本和样式
- `images/`, `fonts/` - 图片和字体
- `dist/`, `static/` - 构建产物
- `_next/`, `_nuxt/` - 框架特定目录

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个工作流！

## 许可证

MIT License
