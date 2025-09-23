
(function() {
  // 版本切换器自动注入脚本
  if (typeof window !== 'undefined' && !window.versionSwitcherInjected) {
    window.versionSwitcherInjected = true;
    window.currentVersion = '1.0.1';
    
    // 动态加载版本切换器
    const script = document.createElement('script');
    script.src = '../version-switcher.js';
    script.async = true;
    document.head.appendChild(script);
    
    // 加载样式
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../version-switcher.css';
    document.head.appendChild(link);
  }
})();
