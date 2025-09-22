#!/usr/bin/env node

/**
 * 开发服务器
 * 用于本地测试版本切换器功能
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME 类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

function serveFile(filePath, res) {
    const ext = path.extname(filePath);
    const mimeType = mimeTypes[ext] || 'text/plain';
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }
        
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // 移除查询参数
    pathname = pathname.split('?')[0];
    
    // 安全检查：防止路径遍历
    if (pathname.includes('..')) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request');
        return;
    }
    
    console.log(`📡 ${req.method} ${pathname}`);
    
    // 根路径重定向到测试项目
    if (pathname === '/') {
        res.writeHead(302, { 'Location': '/test/' });
        res.end();
        return;
    }
    
    // 处理版本切换器资源
    if (pathname === '/test/version-switcher.js') {
        serveFile(path.join(__dirname, '..', 'src', 'version-switcher.js'), res);
        return;
    }
    
    if (pathname === '/test/version-switcher-iframe.js') {
        serveFile(path.join(__dirname, '..', 'src', 'version-switcher-iframe.js'), res);
        return;
    }
    
    if (pathname === '/test/version-switcher.css') {
        serveFile(path.join(__dirname, '..', 'src', 'version-switcher.css'), res);
        return;
    }
    
    // 模拟版本信息 API for test
    if (pathname === '/test/versions.json' || pathname === '/versions.json') {
        const mockVersions = {
            versions: [
                {
                    version: 'v1.0.0',
                    cleanVersion: '1.0.0',
                    buildDate: '2025/9/22',
                    path: 'current'
                },
                {
                    version: 'v0.9.0',
                    cleanVersion: '0.9.0',
                    buildDate: '2025/9/20',
                    path: '0.9.0'
                }
            ],
            latest: {
                version: 'v1.0.0',
                cleanVersion: '1.0.0',
                path: 'current'
            },
            count: 2
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockVersions, null, 2));
        return;
    }
    
    // 处理版本预览路由
    if (pathname.startsWith('/test-version/')) {
        const versionMatch = pathname.match(/\/test-version\/([^\/]+)\//);
        if (versionMatch) {
            const version = versionMatch[1];
            
            // 为不同版本创建模拟内容
            let versionContent = '';
            if (version === '0.9.0') {
                versionContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>版本归档测试项目 v0.9.0</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .version {
            display: inline-block;
            background: #28a745;
            color: white;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 14px;
            margin-left: 10px;
        }
        .old-features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature {
            padding: 20px;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            background: #f8f9fa;
        }
        .feature h3 {
            margin-top: 0;
            color: #28a745;
        }
        .note {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 版本归档测试项目（旧版本）</h1>
            <p>当前版本：<span class="version">v0.9.0</span></p>
            <p>这是一个较早的版本，功能相对简单</p>
        </div>

        <div class="note">
            <strong>📌 注意：</strong> 这是v0.9.0版本的预览，功能较新版本有所差异
        </div>

        <div class="old-features">
            <div class="feature">
                <h3>📦 基础功能</h3>
                <p>早期版本只有基础的显示功能</p>
            </div>
            <div class="feature">
                <h3>🎨 简单样式</h3>
                <p>使用了基础的CSS样式设计</p>
            </div>
            <div class="feature">
                <h3>⚡ 轻量级</h3>
                <p>功能较少，但加载速度快</p>
            </div>
        </div>

        <div style="text-align: center; margin-top: 40px; color: #666;">
            <p>构建时间: 2025/9/20 10:00:00</p>
            <p>版本特色: 这是一个历史版本的演示</p>
        </div>
    </div>

    <script>
        console.log('📄 历史版本 v0.9.0 加载完成');
        window.currentVersion = '0.9.0';
    </script>
</body>
</html>`;
            } else {
                versionContent = `
<!DOCTYPE html>
<html>
<head><title>版本 ${version}</title></head>
<body>
    <h1>版本 ${version} (演示)</h1>
    <p>这是版本 ${version} 的模拟内容</p>
    <script>window.currentVersion = '${version}';</script>
</body>
</html>`;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(versionContent);
            return;
        }
    }

    // 处理测试项目路径
    if (pathname.startsWith('/test/')) {
        const testPath = pathname.replace('/test/', '');
        let filePath;
        
        if (!testPath || testPath === '') {
            filePath = path.join(__dirname, '..', 'test', 'dist', 'index.html');
        } else {
            filePath = path.join(__dirname, '..', 'test', 'dist', testPath);
        }
        
        // 检查文件是否存在
        if (fs.existsSync(filePath)) {
            if (fs.statSync(filePath).isDirectory()) {
                filePath = path.join(filePath, 'index.html');
            }
            serveFile(filePath, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
        }
        return;
    }
    
    // 处理版本切换器资源
    if (pathname === '/version-switcher.js') {
        serveFile(path.join(__dirname, '..', 'src', 'version-switcher.js'), res);
        return;
    }
    
    if (pathname === '/version-switcher.css') {
        serveFile(path.join(__dirname, '..', 'src', 'version-switcher.css'), res);
        return;
    }
    
    // 模拟版本信息 API
    if (pathname === '/versions.json') {
        const mockVersions = {
            versions: [
                {
                    version: 'v1.0.0',
                    cleanVersion: '1.0.0',
                    buildDate: '2025/9/22',
                    path: '1.0.0'
                },
                {
                    version: 'v0.9.0',
                    cleanVersion: '0.9.0',
                    buildDate: '2025/9/20',
                    path: '0.9.0'
                }
            ],
            latest: {
                version: 'v1.0.0',
                cleanVersion: '1.0.0',
                path: '1.0.0'
            },
            count: 2
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mockVersions, null, 2));
        return;
    }
    
    // 默认 404
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
        <h1>404 - 页面未找到</h1>
        <p>可用路径：</p>
        <ul>
            <li><a href="/test/">测试项目</a></li>
            <li><a href="/version-switcher.js">版本切换器 JS</a></li>
            <li><a href="/version-switcher.css">版本切换器 CSS</a></li>
            <li><a href="/versions.json">版本信息 API</a></li>
        </ul>
    `);
});

server.listen(PORT, () => {
    console.log(`🚀 开发服务器启动成功！`);
    console.log(`📡 本地地址: http://localhost:${PORT}`);
    console.log(`🧪 测试项目: http://localhost:${PORT}/test/`);
    console.log(`📚 使用说明:`);
    console.log(`   - 访问 /test/ 查看测试项目`);
    console.log(`   - 左上角应该显示版本切换器`);
    console.log(`   - 按 Ctrl+C 停止服务器`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\\n🛑 正在关闭开发服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});
