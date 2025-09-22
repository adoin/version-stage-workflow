/**
 * 版本切换器 UI 组件
 * 在页面左上角显示悬浮控制器，支持版本搜索和切换
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
      this.currentVersion = window.currentVersion || 'unknown';
      this.isOpen = false;
      this.searchTerm = '';
      this.filteredVersions = [];
      
      this.init();
    }

    async init() {
      try {
        await this.loadVersions();
        this.createUI();
        this.bindEvents();
        console.log('🔄 版本切换器已初始化');
      } catch (error) {
        console.error('❌ 版本切换器初始化失败:', error);
      }
    }

    async loadVersions() {
      try {
        // 尝试从相对路径加载版本信息
        const response = await fetch('../versions.json');
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
      this.versions = [{
        version: 'v' + this.currentVersion,
        cleanVersion: this.currentVersion,
        buildDate: new Date().toLocaleDateString('zh-CN'),
        path: '.'
      }];
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

        item.innerHTML = `
          <div class="version-name">${version.version}</div>
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
          this.close();
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
      if (version.cleanVersion === this.currentVersion) {
        this.close();
        return;
      }

      console.log('🔄 切换到版本:', version.version);
      
      // 构建目标URL
      const currentPath = window.location.pathname;
      const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
      const targetUrl = `${currentDir}/../${version.path}/`;
      
      // 跳转到目标版本
      window.location.href = targetUrl;
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
