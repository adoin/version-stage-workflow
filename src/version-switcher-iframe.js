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
            top: 15px;
            left: 15px;
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .version-trigger {
            width: 40px;
            height: 40px;
            background: rgba(0,0,0,0.7);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s ease;
          }
          
          .version-trigger:hover {
            background: rgba(0,0,0,0.8);
          }
          
          .version-dropdown {
            position: absolute;
            top: 45px;
            left: 0;
            width: 220px;
            max-height: 300px;
            background: white;
            border-radius: 6px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            opacity: 0;
            visibility: hidden;
            transform: translateY(-5px);
            transition: all 0.2s ease;
            overflow: hidden;
          }
          
          .version-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }
          
          .dropdown-header {
            padding: 12px 15px;
            background: #f8f9fa;
            color: #333;
            font-weight: 500;
            font-size: 14px;
            border-bottom: 1px solid #eee;
          }
          
          .dropdown-search {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          
          .search-input {
            width: 100%;
            padding: 6px 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            outline: none;
            font-size: 12px;
            box-sizing: border-box;
          }
          
          .search-input:focus {
            border-color: #007bff;
          }
          
          .version-list {
            max-height: 200px;
            overflow-y: auto;
          }
          
          .version-item {
            padding: 10px 15px;
            cursor: pointer;
            border-bottom: 1px solid #f0f0f0;
            transition: background-color 0.15s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .version-item:hover {
            background-color: #f8f9fa;
          }
          
          .version-item.current {
            background: #e3f2fd;
            color: #1976d2;
          }
          
          .version-item:last-child {
            border-bottom: none;
          }
          
          .version-info {
            flex: 1;
          }
          
          .version-name {
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 2px;
          }
          
          .version-date {
            font-size: 11px;
            color: #666;
          }
          
          .version-badge {
            background: #28a745;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: 500;
          }
          
          .current-badge {
            background: #007bff;
          }
          
          .loading, .no-results {
            padding: 15px;
            text-align: center;
            color: #999;
            font-size: 12px;
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
      console.log(`🔍 版本路径数据: ${versionPath}`);
      
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