/**
 * 版本切换器 - URL 路径切换方案
 * 通过修改 URL 路径来切换不同版本，避免 iframe 兼容性问题
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
      
      this.init();
    }

    async init() {
      try {
        await this.loadVersions();
        this.detectCurrentVersion();
        this.createUI();
        this.bindEvents();
        console.log('🔄 版本切换器已初始化 (URL 路径模式)');
      } catch (error) {
        console.error('❌ 版本切换器初始化失败:', error);
      }
    }

    async loadVersions() {
      try {
        // 尝试从根目录加载版本信息
        const response = await fetch('/versions.json');
        if (response.ok) {
          const data = await response.json();
          this.versions = data.versions || [];
          return;
        }
      } catch (error) {
        console.warn('无法从根目录加载版本信息，尝试相对路径:', error);
      }

      try {
        // 尝试从相对路径加载
        const response = await fetch('../versions.json');
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
        path: 'v1.0.0'
      }];
    }

    detectCurrentVersion() {
      // 从 URL 路径检测当前版本
      const pathname = window.location.pathname;
      const versionMatch = pathname.match(/\/v?(\d+\.\d+\.\d+)\//);
      
      if (versionMatch) {
        this.currentVersion = versionMatch[1];
      } else if (window.currentVersion) {
        this.currentVersion = window.currentVersion;
      } else {
        // 默认为最新版本
        this.currentVersion = this.versions[0]?.cleanVersion || '1.0.0';
      }

      console.log(`🔍 当前版本: ${this.currentVersion}`);
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
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .version-trigger {
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            transition: all 0.2s ease;
            user-select: none;
          }
          
          .version-trigger:hover {
            background: rgba(0, 0, 0, 0.9);
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
          }
          
          .version-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 8px;
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 6px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            min-width: 280px;
            max-height: 400px;
            overflow-y: auto;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.2s ease;
          }
          
          .version-dropdown.open {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
          }
          
          .version-search {
            padding: 12px;
            border-bottom: 1px solid #e1e5e9;
          }
          
          .version-search input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5da;
            border-radius: 4px;
            font-size: 14px;
            outline: none;
            box-sizing: border-box;
          }
          
          .version-search input:focus {
            border-color: #0366d6;
            box-shadow: 0 0 0 2px rgba(3, 102, 214, 0.2);
          }
          
          .version-list {
            max-height: 300px;
            overflow-y: auto;
          }
          
          .version-item {
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #f6f8fa;
            transition: background-color 0.15s ease;
          }
          
          .version-item:hover {
            background: #f6f8fa;
          }
          
          .version-item.current {
            background: #e3f2fd;
            border-left: 3px solid #0366d6;
          }
          
          .version-name {
            font-size: 14px;
            font-weight: 500;
            color: #24292e;
            margin-bottom: 4px;
          }
          
          .version-date {
            font-size: 12px;
            color: #586069;
          }
          
          .version-badge {
            background: #28a745;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            margin-left: 8px;
          }
          
          .no-results {
            padding: 20px;
            text-align: center;
            color: #586069;
            font-size: 14px;
          }
          
          @media (max-width: 768px) {
            #version-switcher {
              top: 10px;
              left: 10px;
            }
            
            .version-dropdown {
              min-width: 250px;
            }
          }
        </style>
        
        <div class="version-trigger" id="version-trigger">
          📋 v${this.currentVersion}
        </div>
        
        <div class="version-dropdown" id="version-dropdown">
          <div class="version-search">
            <input type="text" id="version-search" placeholder="搜索版本..." />
          </div>
          <div class="version-list" id="version-list">
            <div class="loading">正在加载版本列表...</div>
          </div>
        </div>
      `;
      
      document.body.appendChild(this.container);
      
      this.trigger = document.getElementById('version-trigger');
      this.dropdown = document.getElementById('version-dropdown');
      this.searchInput = document.getElementById('version-search');
      this.versionList = document.getElementById('version-list');
      
      this.renderVersionList();
    }

    bindEvents() {
      // 点击触发器切换下拉菜单
      this.trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });

      // 搜索功能
      this.searchInput.addEventListener('input', (e) => {
        this.filterVersions(e.target.value);
      });

      // 键盘导航
      this.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
      });

      // 点击外部关闭
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          this.close();
        }
      });

      // ESC 键关闭
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
    }

    renderVersionList(filteredVersions = null) {
      const versions = filteredVersions || this.versions;
      
      if (versions.length === 0) {
        this.versionList.innerHTML = '<div class="no-results">未找到匹配的版本</div>';
        return;
      }

      this.versionList.innerHTML = versions.map(version => {
        const isCurrent = version.cleanVersion === this.currentVersion;
        const isLatest = version === this.versions[0];
        
        return `
          <div class="version-item ${isCurrent ? 'current' : ''}" data-version="${version.cleanVersion}" data-path="${version.path}">
            <div class="version-name">
              ${version.version}
              ${isLatest ? '<span class="version-badge">最新</span>' : ''}
            </div>
            <div class="version-date">${version.buildDate || '未知日期'}</div>
          </div>
        `;
      }).join('');

      // 绑定版本切换事件
      this.versionList.querySelectorAll('.version-item').forEach(item => {
        item.addEventListener('click', () => {
          const version = item.dataset.version;
          const versionPath = item.dataset.path;
          this.switchToVersion(version, versionPath);
        });
      });
    }

    filterVersions(searchTerm) {
      if (!searchTerm.trim()) {
        this.renderVersionList();
        return;
      }

      const filtered = this.versions.filter(version => 
        version.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.cleanVersion.includes(searchTerm) ||
        (version.buildDate && version.buildDate.includes(searchTerm))
      );

      this.renderVersionList(filtered);
    }

    switchToVersion(version, versionPath) {
      this.close();
      
      console.log(`🔄 切换到版本 ${version}: ${versionPath}`);
      
      // 构建新的 URL
      const currentPath = window.location.pathname;
      const basePath = this.getBasePath();
      const newPath = `${basePath}${versionPath}/`;
      
      console.log(`🔍 当前路径: ${currentPath}`);
      console.log(`🔍 新路径: ${newPath}`);
      
      // 直接跳转到新版本
      window.location.href = newPath;
    }

    getBasePath() {
      // 获取项目的基础路径
      const pathname = window.location.pathname;
      
      // 如果在版本目录中，提取基础路径
      const versionMatch = pathname.match(/^(.*?)\/v?\d+\.\d+\.\d+\//);
      if (versionMatch) {
        return versionMatch[1] + '/';
      }
      
      // 如果在根目录，返回当前路径
      return pathname.endsWith('/') ? pathname : pathname + '/';
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
      this.dropdown.classList.add('open');
      this.searchInput.focus();
    }

    close() {
      this.isOpen = false;
      this.dropdown.classList.remove('open');
      this.searchInput.value = '';
      this.renderVersionList(); // 重置列表
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