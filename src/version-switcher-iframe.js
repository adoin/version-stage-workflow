/**
 * 版本切换器 UI 组件 (iframe版本)
 * 使用iframe方式加载不同版本，避免页面跳转问题
 */

(function() {
  'use strict';

  // 防止重复初始化
  if (window.versionSwitcherInitialized) {
    return;
  }
  window.versionSwitcherInitialized = true;

  class VersionSwitcherIframe {
    constructor() {
      this.versions = [];
      this.currentVersion = window.currentVersion || 'unknown';
      this.isOpen = false;
      this.searchTerm = '';
      this.filteredVersions = [];
      this.iframe = null;
      
      this.init();
    }

    async init() {
      try {
        await this.loadVersions();
        this.createUI();
        this.createIframe();
        this.bindEvents();
        console.log('🔄 版本切换器（iframe版）已初始化');
      } catch (error) {
        console.error('❌ 版本切换器初始化失败:', error);
      }
    }

    async loadVersions() {
      try {
        // 尝试从相对路径加载版本信息
        const response = await fetch('versions.json');
        if (response.ok) {
          const data = await response.json();
          this.versions = data.versions || [];
          this.filteredVersions = [...this.versions];
          return;
        }
      } catch (error) {
        console.warn('无法从相对路径加载版本信息:', error);
      }

      // 如果无法加载，使用当前版本作为默认
      this.versions = [
        {
          version: 'v' + this.currentVersion,
          cleanVersion: this.currentVersion,
          buildDate: new Date().toLocaleDateString('zh-CN'),
          path: 'current'
        },
        {
          version: 'v0.9.0',
          cleanVersion: '0.9.0',
          buildDate: '2025/9/20',
          path: '0.9.0'
        }
      ];
      this.filteredVersions = [...this.versions];
    }

    createUI() {
      // 创建主容器
      this.container = document.createElement('div');
      this.container.id = 'version-switcher';
      this.container.className = 'version-switcher';

      // 创建触发按钮
      this.trigger = document.createElement('div');
      this.trigger.className = 'version-trigger';
      this.trigger.innerHTML = `
        <span class="version-icon">🏷️</span>
        <span class="version-text">${this.currentVersion}</span>
        <span class="version-arrow">▼</span>
      `;

      // 创建下拉面板
      this.dropdown = document.createElement('div');
      this.dropdown.className = 'version-dropdown';
      this.dropdown.style.display = 'none';

      // 创建搜索框
      this.searchInput = document.createElement('input');
      this.searchInput.type = 'text';
      this.searchInput.className = 'version-search';
      this.searchInput.placeholder = '搜索版本...';

      // 创建版本列表
      this.versionList = document.createElement('div');
      this.versionList.className = 'version-list';

      // 组装UI
      this.dropdown.appendChild(this.searchInput);
      this.dropdown.appendChild(this.versionList);
      this.container.appendChild(this.trigger);
      this.container.appendChild(this.dropdown);

      // 添加到页面
      document.body.appendChild(this.container);

      // 渲染版本列表
      this.renderVersionList();
    }

    createIframe() {
      // 创建iframe容器（初始时隐藏）
      this.iframeContainer = document.createElement('div');
      this.iframeContainer.id = 'version-iframe-container';
      this.iframeContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 9999;
        display: none;
      `;

      // 创建iframe
      this.iframe = document.createElement('iframe');
      this.iframe.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        margin: 0;
        padding: 0;
      `;

      // 创建关闭按钮
      const closeButton = document.createElement('div');
      closeButton.innerHTML = '✕';
      closeButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        background: rgba(0,0,0,0.7);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 16px;
        z-index: 10000;
      `;
      
      closeButton.addEventListener('click', () => {
        this.closeIframe();
      });

      this.iframeContainer.appendChild(this.iframe);
      this.iframeContainer.appendChild(closeButton);
      document.body.appendChild(this.iframeContainer);
    }

    renderVersionList() {
      this.versionList.innerHTML = '';

      if (this.filteredVersions.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'version-item no-results';
        noResults.textContent = '未找到匹配的版本';
        this.versionList.appendChild(noResults);
        return;
      }

      this.filteredVersions.forEach(version => {
        const item = document.createElement('div');
        item.className = 'version-item';
        if (version.cleanVersion === this.currentVersion) {
          item.classList.add('current');
        }

        const isCurrentVersion = version.cleanVersion === this.currentVersion && version.path === 'current';
        const statusText = isCurrentVersion ? '(当前版本)' : '';
        
        item.innerHTML = `
          <div class="version-name">${version.version} ${statusText}</div>
          <div class="version-date">${version.buildDate}</div>
        `;

        item.addEventListener('click', () => {
          this.switchVersion(version);
        });

        this.versionList.appendChild(item);
      });
    }

    bindEvents() {
      // 点击触发按钮
      this.trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });

      // 搜索功能
      this.searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.filterVersions();
      });

      // 点击外部关闭
      document.addEventListener('click', (e) => {
        if (!this.container.contains(e.target)) {
          this.close();
        }
      });

      // ESC 键关闭
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (this.iframeContainer.style.display !== 'none') {
            this.closeIframe();
          } else {
            this.close();
          }
        }
      });

      // 防止下拉面板内部点击冒泡
      this.dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    filterVersions() {
      if (!this.searchTerm) {
        this.filteredVersions = [...this.versions];
      } else {
        this.filteredVersions = this.versions.filter(version => 
          version.version.toLowerCase().includes(this.searchTerm) ||
          version.cleanVersion.toLowerCase().includes(this.searchTerm) ||
          version.buildDate.includes(this.searchTerm)
        );
      }
      this.renderVersionList();
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
      this.dropdown.style.display = 'block';
      this.trigger.classList.add('active');
      this.searchInput.focus();
      
      // 重置搜索
      this.searchInput.value = '';
      this.searchTerm = '';
      this.filterVersions();
    }

    close() {
      this.isOpen = false;
      this.dropdown.style.display = 'none';
      this.trigger.classList.remove('active');
    }

    switchVersion(version) {
      console.log('🔄 切换到版本:', version.version);
      this.close();
      
      // 如果点击当前版本且iframe已显示，则关闭iframe回到主页面
      if (version.cleanVersion === this.currentVersion && version.path === 'current') {
        if (this.iframeContainer.style.display !== 'none') {
          this.closeIframe();
        } else {
          // 如果iframe没有显示，则在iframe中显示当前版本
          this.loadVersionInIframe(window.location.href, version);
        }
        return;
      }
      
      // 构建目标URL
      let targetUrl;
      if (version.path === 'current') {
        // 当前版本，使用当前页面URL
        targetUrl = window.location.href;
      } else {
        // 其他版本，构建测试URL
        targetUrl = `/test-version/${version.cleanVersion}/`;
      }
      
      // 在iframe中加载版本
      this.loadVersionInIframe(targetUrl, version);
    }

    loadVersionInIframe(url, version) {
      this.iframe.src = url;
      this.iframeContainer.style.display = 'block';
      
      // 更新标题显示当前查看的版本
      document.title = `版本预览: ${version.version} - ${document.title}`;
      
      // iframe加载完成后的处理
      this.iframe.onload = () => {
        console.log(`✅ 版本 ${version.version} 加载完成`);
        
        // 可以在这里添加一些版本信息显示
        this.showVersionInfo(version);
      };
      
      this.iframe.onerror = () => {
        console.error(`❌ 版本 ${version.version} 加载失败`);
        alert(`版本 ${version.version} 加载失败，可能是路径不存在`);
        this.closeIframe();
      };
    }

    showVersionInfo(version) {
      // 在iframe上方显示版本信息
      let versionInfo = document.getElementById('version-info-bar');
      if (!versionInfo) {
        versionInfo = document.createElement('div');
        versionInfo.id = 'version-info-bar';
        versionInfo.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          z-index: 10001;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        this.iframeContainer.appendChild(versionInfo);
      }
      
      versionInfo.innerHTML = `
        <span>📋 当前预览版本: ${version.version} (${version.buildDate})</span>
      `;
      
      // 调整iframe位置，为信息栏让出空间
      this.iframe.style.marginTop = '40px';
      this.iframe.style.height = 'calc(100% - 40px)';
    }

    closeIframe() {
      this.iframeContainer.style.display = 'none';
      this.iframe.src = 'about:blank';
      
      // 恢复原标题
      document.title = document.title.replace(/版本预览: v[\d\.]+ - /, '');
      
      // 移除版本信息栏
      const versionInfo = document.getElementById('version-info-bar');
      if (versionInfo) {
        versionInfo.remove();
      }
      
      // 重置iframe样式
      this.iframe.style.marginTop = '0';
      this.iframe.style.height = '100%';
    }
  }

  // 等待 DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new VersionSwitcherIframe();
    });
  } else {
    new VersionSwitcherIframe();
  }

})();
