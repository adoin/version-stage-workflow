/**
 * 版本切换器 - 主页面版本
 * 在主页面的 iframe 中切换不同版本，URL 不变
 */

(function() {
  'use strict';

  // 防止重复初始化
  if (window.versionSwitcherInitialized) {
    return;
  }
  window.versionSwitcherInitialized = true;

  class VersionSwitcher {
    constructor() {
      this.versions = [];
      this.currentVersion = null;
      this.isOpen = false;
      this.iframe = document.getElementById('version-iframe');
      this.loading = document.getElementById('loading');
      
      this.init();
    }

    async init() {
      try {
        await this.loadVersions();
        this.createUI();
        this.bindEvents();
        this.loadLatestVersion();
        console.log('🔄 版本切换器已初始化');
      } catch (error) {
        console.error('❌ 版本切换器初始化失败:', error);
      }
    }

    async loadVersions() {
      try {
        const response = await fetch('versions/index.json');
        if (response.ok) {
          const data = await response.json();
          this.versions = data.versions || [];
          return;
        }
      } catch (error) {
        console.warn('无法加载版本信息:', error);
      }

      // 如果无法加载，创建默认版本
      this.versions = [{
        version: 'v1.0.0',
        cleanVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        path: 'versions/1.0.0'
      }];
    }

    createUI() {
      // 创建版本切换器容器
      this.container = document.createElement('div');
      this.container.id = 'version-switcher';
      this.container.innerHTML = `
        <style>
          #version-switcher {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .version-trigger {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            transition: all 0.3s ease;
            border: 3px solid rgba(255,255,255,0.2);
          }
          
          .version-trigger:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 30px rgba(0,0,0,0.25);
          }
          
          .version-trigger.active {
            background: linear-gradient(135deg, #764ba2, #667eea);
          }
          
          .version-dropdown {
            position: absolute;
            top: 60px;
            left: 0;
            min-width: 300px;
            max-width: 400px;
            max-height: 400px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            overflow: hidden;
            backdrop-filter: blur(20px);
          }
          
          .version-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }
          
          .dropdown-header {
            padding: 20px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
          }
          
          .dropdown-search {
            padding: 15px;
            border-bottom: 1px solid #eee;
          }
          
          .search-input {
            width: 100%;
            padding: 10px 15px;
            border: 1px solid #ddd;
            border-radius: 25px;
            outline: none;
            font-size: 14px;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
          }
          
          .search-input:focus {
            border-color: #667eea;
          }
          
          .version-list {
            max-height: 250px;
            overflow-y: auto;
          }
          
          .version-item {
            padding: 15px 20px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .version-item:hover {
            background-color: #f8f9ff;
          }
          
          .version-item.current {
            background: linear-gradient(135deg, #e8f4fd, #f0f8ff);
            color: #2c5aa0;
            font-weight: 600;
          }
          
          .version-item:last-child {
            border-bottom: none;
          }
          
          .version-info {
            flex: 1;
          }
          
          .version-name {
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .version-date {
            font-size: 12px;
            color: #666;
          }
          
          .version-badge {
            background: #27ae60;
            color: white;
            padding: 3px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
          }
          
          .current-badge {
            background: #3498db;
          }
          
          .loading, .no-results {
            padding: 20px;
            text-align: center;
            color: #999;
          }
          
          @media (max-width: 768px) {
            #version-switcher {
              top: 10px;
              left: 10px;
            }
            
            .version-trigger {
              width: 45px;
              height: 45px;
              font-size: 16px;
            }
            
            .version-dropdown {
              min-width: 280px;
              max-width: calc(100vw - 40px);
            }
          }
        </style>
        
        <div class="version-trigger" id="version-trigger">
          🔄
        </div>
        
        <div class="version-dropdown" id="version-dropdown">
          <div class="dropdown-header">
            版本切换器
          </div>
          
          <div class="dropdown-search">
            <input type="text" class="search-input" placeholder="搜索版本..." id="version-search">
          </div>
          
          <div class="version-list" id="version-list">
            <div class="loading">正在加载...</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(this.container);
      
      this.trigger = document.getElementById('version-trigger');
      this.dropdown = document.getElementById('version-dropdown');
      this.searchInput = document.getElementById('version-search');
      this.versionList = document.getElementById('version-list');
      
      this.renderVersions();
    }

    renderVersions() {
      if (this.versions.length === 0) {
        this.versionList.innerHTML = '<div class="no-results">暂无版本</div>';
        return;
      }

      this.versionList.innerHTML = this.versions.map((version, index) => {
        const isCurrent = version.cleanVersion === this.currentVersion;
        const isLatest = index === 0;
        
        let badge = '';
        if (isCurrent) {
          badge = '<span class="version-badge current-badge">当前</span>';
        } else if (isLatest) {
          badge = '<span class="version-badge">最新</span>';
        }
        
        const date = new Date(version.timestamp).toLocaleString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return `
          <div class="version-item ${isCurrent ? 'current' : ''}" 
               data-version="${version.cleanVersion}"
               data-path="${version.path}">
            <div class="version-info">
              <div class="version-name">${version.version}</div>
              <div class="version-date">${date}</div>
            </div>
            ${badge}
          </div>
        `;
      }).join('');
      
      // 绑定点击事件
      this.versionList.querySelectorAll('.version-item').forEach(item => {
        item.addEventListener('click', () => {
          const versionPath = item.dataset.path;
          const version = item.dataset.version;
          this.switchToVersion(versionPath, version);
        });
      });
    }

    bindEvents() {
      this.trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
      
      this.dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      document.addEventListener('click', () => {
        this.close();
      });
      
      this.searchInput.addEventListener('input', (e) => {
        this.filterVersions(e.target.value);
      });
    }

    filterVersions(query) {
      const filteredVersions = query 
        ? this.versions.filter(v => 
            v.version.toLowerCase().includes(query.toLowerCase()) ||
            v.cleanVersion.includes(query)
          )
        : this.versions;
      
      this.renderFilteredVersions(filteredVersions);
    }

    renderFilteredVersions(versions) {
      if (versions.length === 0) {
        this.versionList.innerHTML = '<div class="no-results">未找到匹配的版本</div>';
        return;
      }
      
      // 类似 renderVersions 但使用过滤后的版本
      this.versionList.innerHTML = versions.map((version, index) => {
        const isCurrent = version.cleanVersion === this.currentVersion;
        const isLatest = this.versions.indexOf(version) === 0;
        
        let badge = '';
        if (isCurrent) {
          badge = '<span class="version-badge current-badge">当前</span>';
        } else if (isLatest) {
          badge = '<span class="version-badge">最新</span>';
        }
        
        const date = new Date(version.timestamp).toLocaleString('zh-CN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return `
          <div class="version-item ${isCurrent ? 'current' : ''}" 
               data-version="${version.cleanVersion}"
               data-path="${version.path}">
            <div class="version-info">
              <div class="version-name">${version.version}</div>
              <div class="version-date">${date}</div>
            </div>
            ${badge}
          </div>
        `;
      }).join('');
      
      // 重新绑定点击事件
      this.versionList.querySelectorAll('.version-item').forEach(item => {
        item.addEventListener('click', () => {
          const versionPath = item.dataset.path;
          const version = item.dataset.version;
          this.switchToVersion(versionPath, version);
        });
      });
    }

    toggle() {
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }

    open() {
      this.isOpen = true;
      this.dropdown.classList.add('show');
      this.trigger.classList.add('active');
      
      // 聚焦搜索框
      setTimeout(() => {
        this.searchInput.focus();
      }, 100);
    }

    close() {
      this.isOpen = false;
      this.dropdown.classList.remove('show');
      this.trigger.classList.remove('active');
      
      // 清空搜索
      this.searchInput.value = '';
      this.renderVersions();
    }

    loadLatestVersion() {
      if (this.versions.length > 0) {
        const latest = this.versions[0];
        this.switchToVersion(latest.path, latest.cleanVersion);
      }
    }

    switchToVersion(versionPath, version) {
      this.close();
      this.currentVersion = version;
      
      // 显示加载状态
      this.loading.style.display = 'block';
      this.iframe.style.display = 'none';
      
      // 构建完整的版本路径
      const fullPath = versionPath + '/index.html';
      
      console.log(`🔄 切换到版本 ${version}: ${fullPath}`);
      
      // 加载版本到 iframe
      this.iframe.src = fullPath;
      
      this.iframe.onload = () => {
        this.loading.style.display = 'none';
        this.iframe.style.display = 'block';
        console.log(`✅ 版本 ${version} 加载完成`);
        
        // 更新当前版本显示
        this.renderVersions();
      };
      
      this.iframe.onerror = () => {
        this.loading.innerHTML = `❌ 版本 ${version} 加载失败`;
        console.error(`❌ 版本 ${version} 加载失败`);
      };
    }
  }

  // 等待 DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new VersionSwitcher();
    });
  } else {
    new VersionSwitcher();
  }

})();