# 故障排除指南

## ❌ 常见错误及解决方案

### 1. GITHUB_TOKEN 冲突错误

**错误信息**：
```
Invalid workflow file: .github/workflows/auto-archive-version.yml#L53
error parsing called workflow
secret name `GITHUB_TOKEN` within `workflow_call` can not be used since it would collide with system reserved name
```

**原因**：
`GITHUB_TOKEN` 是GitHub系统保留的密钥名称，在可复用工作流(`workflow_call`)中会自动提供，不能在 `secrets` 部分显式声明。

**解决方案**：
从调用工作流中移除 `secrets` 部分：

❌ **错误的写法**：
```yaml
archive:
  needs: build
  uses: adoin/version-stage-workflow/.github/workflows/version-archive.yml@main
  with:
    build_dir: 'dist'
  secrets:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # ← 删除这部分
```

✅ **正确的写法**：
```yaml
archive:
  needs: build
  uses: adoin/version-stage-workflow/.github/workflows/version-archive.yml@main
  with:
    build_dir: 'dist'
  # GITHUB_TOKEN 由系统自动提供，无需手动传递
```

### 2. 权限不足错误

**错误信息**：
```
Resource not accessible by integration
```

**解决方案**：
确保仓库设置正确的权限：

1. **仓库设置** → **Actions** → **General**
2. **Workflow permissions** 选择：
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"

### 3. 构建失败错误

**错误信息**：
```
Error: Command failed: npm run build
```

**解决方案**：
1. 确保 `package.json` 中有 `build` 脚本：
   ```json
   {
     "scripts": {
       "build": "your-build-command"
     }
   }
   ```

2. 确保构建输出目录存在且正确：
   ```yaml
   with:
     build_dir: 'dist'  # 确保这是正确的输出目录
   ```

### 4. Pages 部署失败

**错误信息**：
```
Error: No such file or directory: archive
```

**解决方案**：
1. 确保启用了 GitHub Pages：
   - **Settings** → **Pages** → **Deploy from a branch** → **gh-pages**

2. 检查分支权限：
   ```yaml
   permissions:
     contents: write
     pages: write
     id-token: write
   ```

### 5. 版本重复错误

**错误信息**：
```
Version v1.0.0 already exists
```

**解决方案**：
1. **使用不同版本号**：
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

2. **强制覆盖现有版本**：
   ```yaml
   with:
     force_archive: true
   ```

### 6. 工作流找不到错误

**错误信息**：
```
error parsing called workflow: workflow was not found
```

**解决方案**：
1. 确保仓库路径正确：
   ```yaml
   uses: your-username/version-stage-workflow/.github/workflows/version-archive.yml@main
   ```

2. 确保分支名称正确（`@main` 或 `@master`）

3. 确保仓库是公开的或有正确的访问权限

## 🔍 调试技巧

### 1. 查看详细日志
1. **Actions** → 选择失败的运行
2. 点击具体的步骤查看详细错误信息
3. 展开日志查看完整输出

### 2. 本地测试
```bash
# 本地测试构建
npm run build

# 检查输出目录
ls -la dist/

# 测试脚本
node scripts/archive-version.js --help
```

### 3. 分步调试
在工作流中添加调试步骤：
```yaml
- name: 调试信息
  run: |
    echo "当前目录: $(pwd)"
    echo "文件列表: $(ls -la)"
    echo "构建目录内容: $(ls -la dist/ || echo '构建目录不存在')"
```

## 📞 获取帮助

如果遇到其他问题：

1. **检查示例项目** → `test/` 目录中的完整示例
2. **查看工作流日志** → Actions页面的详细日志
3. **参考文档** → [使用文档](usage.md) 和 [工作流指南](workflow-usage-guide.md)

## 🔄 版本更新

确保使用最新版本的工作流：
```yaml
uses: your-username/version-stage-workflow/.github/workflows/version-archive.yml@main
```

定期检查是否有更新和修复。
