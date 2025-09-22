# GitHub Actions 工作流使用指南

## 🎯 触发方式详解

### 方式一：自动触发（推送标签）

```bash
# 1. 确保代码已提交
git add .
git commit -m "准备发布 v1.0.0"

# 2. 创建版本标签
git tag v1.0.0

# 3. 推送标签到远程仓库
git push origin v1.0.0
```

**自动执行流程**：
```
推送标签 v1.0.0
    ↓
触发 GitHub Actions
    ↓
执行构建 (npm run build)
    ↓
归档到 versions/1.0.0/
    ↓
部署到 GitHub Pages
```

### 方式二：手动触发（Web界面）

#### 📱 操作步骤：

1. **进入GitHub仓库** → 点击 "Actions" 标签页
2. **选择工作流** → 点击 "Build and Archive"
3. **手动运行** → 点击 "Run workflow" 下拉按钮

#### 🖼️ 界面示例：
```
┌─ Run workflow ─────────────────────┐
│ Use workflow from: [main ▼]        │
│                                    │
│ 手动指定版本号                        │
│ ┌─────────────────────────────────┐ │
│ │ v1.2.0                          │ │  ← 输入版本号
│ └─────────────────────────────────┘ │
│                                    │
│           [Run workflow]            │
└────────────────────────────────────┘
```

#### ⚙️ 参数说明：
- **版本号字段**：
  - **留空** → 自动从 `package.json` 读取版本
  - **填写** → 使用指定版本（如 `v1.2.0`）

### 方式三：API触发（高级）

使用GitHub API手动触发：

```bash
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/your-username/your-project/actions/workflows/deploy.yml/dispatches \
  -d '{"ref":"main","inputs":{"version":"v1.3.0"}}'
```

## 🔍 执行状态查看

### 实时监控：
1. **Actions页面** → 查看运行状态
2. **工作流详情** → 点击具体运行记录
3. **日志查看** → 展开每个步骤查看详细日志

### 状态指示：
- 🟡 **运行中**：正在执行构建和归档
- ✅ **成功**：归档完成，可访问新版本
- ❌ **失败**：查看错误日志，修复问题后重试

## 📂 归档结果

成功后的目录结构：
```
your-project/
├── gh-pages 分支/
│   ├── versions/
│   │   ├── 1.0.0/          ← 版本 v1.0.0 的完整站点
│   │   │   ├── index.html
│   │   │   ├── assets/
│   │   │   └── version-metadata.json
│   │   ├── 1.2.0/          ← 版本 v1.2.0 的完整站点
│   │   ├── version-switcher.js
│   │   ├── versions.json    ← 版本索引
│   │   └── index.html      ← 版本总览页面
```

## 🌐 访问方式

- **版本总览**: `https://your-username.github.io/your-project/versions/`
- **特定版本**: `https://your-username.github.io/your-project/versions/1.0.0/`
- **最新版本**: 通过版本切换器自动跳转

## ⚠️ 注意事项

### 版本号格式：
- ✅ `v1.0.0`, `v2.1.3`, `v1.0.0-beta.1`
- ❌ `1.0.0`, `version-1.0.0`, `release-1.0.0`

### 构建要求：
- 确保 `package.json` 中有 `build` 脚本
- 确保构建输出目录正确（默认 `dist/`）
- 确保构建成功生成静态文件

### 权限设置：
- 仓库需要启用 GitHub Pages
- Actions 需要有 `contents: write` 权限
- 推荐使用 `GITHUB_TOKEN`（自动提供）

## 🛠️ 故障排除

### 常见问题：

1. **构建失败**：
   ```
   Error: Command failed: npm run build
   ```
   **解决**：检查 `package.json` 的 `scripts.build` 配置

2. **权限错误**：
   ```
   Error: Resource not accessible by integration
   ```
   **解决**：检查仓库的 Actions 权限设置

3. **版本重复**：
   ```
   Error: Version v1.0.0 already exists
   ```
   **解决**：使用 `force_archive: true` 或选择新版本号

4. **Pages未更新**：
   - 等待几分钟让GitHub Pages部署完成
   - 检查仓库的Pages设置是否正确
