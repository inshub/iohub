<template>
  <div id="app">
    <!-- 重新设计的顶部导航 -->
    <nav class="navbar">
      <div class="navbar-container">
        <!-- 品牌Logo区域 -->
        <div class="navbar-brand">
          <router-link to="/" class="brand-link">
            <div class="brand-icon">
              <div class="icon-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon>
                  <line x1="12" y1="22" x2="12" y2="15.5"></line>
                  <polyline points="22,8.5 12,15.5 2,8.5"></polyline>
                </svg>
              </div>
            </div>
            <div class="brand-text">
              <span class="brand-name">GitHub Weekly</span>
              <span class="brand-tagline">开源精选</span>
            </div>
          </router-link>
        </div>

        <!-- 中间空白区域，保持Logo和控制器平衡 -->
        <div class="navbar-spacer"></div>

        <!-- 控制区域 -->
        <div class="navbar-controls">
          <!-- 主题切换器 -->
          <div class="theme-switcher">
            <button 
              @click="toggleTheme"
              class="theme-btn"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            >
              <svg v-if="isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"></circle>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </button>
          </div>

          <!-- 视图切换器 -->
          <div class="view-switcher">
            <button 
              @click="fullShow = !fullShow"
              :class="['switch-btn', { active: fullShow }]"
              :title="fullShow ? '切换到分页模式' : '切换到滚动模式'"
            >
              <div class="switch-track">
                <div class="switch-thumb">
                  <svg v-if="fullShow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3v18M16 3v18"></path>
                  </svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
              </div>
              <span class="switch-label">{{ fullShow ? '滚动' : '分页' }}</span>
            </button>
          </div>

          <!-- GitHub链接 -->
          <a 
            href="https://github.com/inshub/iohub" 
            target="_blank" 
            class="github-btn"
            title="访问GitHub仓库"
          >
            <div class="github-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 19c-5 1.5-5-2.5-7-3M14 19v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 18 2.5 5.07 5.07 0 0 0 18 .5S16.74.5 14 2.5 9.26.5 9.26.5A5.07 5.07 0 0 0 9 2.5 5.44 5.44 0 0 0 7.5 7c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 13 16.87V19"></path>
              </svg>
            </div>
            <span class="github-text">Star</span>
          </a>
        </div>

        <!-- 移动端菜单按钮 -->
        <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">
          <div class="hamburger" :class="{ active: mobileMenuOpen }">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>

      <!-- 移动端菜单 -->
      <div class="mobile-menu" :class="{ open: mobileMenuOpen }">
        <div class="mobile-menu-content">
          <router-link to="/" class="mobile-menu-item" @click="mobileMenuOpen = false">
            <span class="item-icon">🏠</span>
            <span class="item-text">首页</span>
          </router-link>
          
          <div class="mobile-menu-item" @click="showArchive = !showArchive">
            <span class="item-icon">📚</span>
            <span class="item-text">归档</span>
          </div>
          
          <div class="mobile-menu-item" @click="showStats = !showStats">
            <span class="item-icon">📊</span>
            <span class="item-text">统计</span>
          </div>
          
          <div class="mobile-menu-divider"></div>
          
          <a href="https://github.com/inshub/iohub" target="_blank" class="mobile-menu-item">
            <span class="item-icon">⭐</span>
            <span class="item-text">Star on GitHub</span>
          </a>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="main-content">
      <router-view v-model:fullShow="fullShow"></router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const fullShow = ref(true)
const mobileMenuOpen = ref(false)
const showArchive = ref(false)
const showStats = ref(false)
const isDark = ref(false)

// 主题切换功能
const toggleTheme = () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  
  // 更新DOM属性
  document.documentElement.setAttribute('data-theme', theme)
  
  // 保存到本地存储
  localStorage.setItem('theme', theme)
}

// 初始化主题
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  const theme = savedTheme || (prefersDark ? 'dark' : 'light')
  isDark.value = theme === 'dark'
  document.documentElement.setAttribute('data-theme', theme)
}

onMounted(() => {
  initTheme()
  
  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
    }
  })
})
</script>

<style>
/* 新导航样式 - 毛玻璃效果 */
.navbar {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
  transition: all var(--transition-base);
}

[data-theme="dark"] .navbar {
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-xl);
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-xl);
}

/* 品牌区域 */
.navbar-brand {
  flex-shrink: 0;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  text-decoration: none;
  transition: all var(--transition-base);
  padding: var(--spacing-sm);
  border-radius: var(--radius-lg);
}

.brand-link:hover {
  transform: translateY(-1px);
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-circle {
  width: 44px;
  height: 44px;
  background: var(--gradient-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.brand-link:hover .icon-circle {
  box-shadow: var(--shadow-glow);
  transform: rotate(5deg) scale(1.05);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: 1.2;
}

.brand-tagline {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-medium);
}

/* 导航占位区域 */
.navbar-spacer {
  flex: 1;
}

/* 控制区域 */
.navbar-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex-shrink: 0;
}

/* 主题切换器 - 简约设计 */
.theme-switcher {
  display: flex;
  align-items: center;
}

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  color: var(--color-text-secondary);
}

.theme-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

/* 视图切换器 - 简化设计 */
.view-switcher {
  display: flex;
  align-items: center;
}

.switch-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
}

.switch-btn:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.switch-btn.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-inverse);
}

.switch-track {
  display: none;
}

.switch-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
}

.switch-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* GitHub按钮 - 简约风格 */
.github-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
}

.github-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.github-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.github-text {
  font-weight: var(--font-weight-medium);
}

/* 移动端菜单 */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.mobile-menu-btn:hover {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.hamburger {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hamburger span {
  width: 18px;
  height: 2px;
  background: var(--color-text-primary);
  border-radius: 1px;
  transition: all var(--transition-base);
}

.hamburger.active span:nth-child(1) {
  transform: rotate(45deg) translate(4px, 4px);
}

.hamburger.active span:nth-child(2) {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: rotate(-45deg) translate(4px, -4px);
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-bg-glass);
  backdrop-filter: blur(24px);
  border-top: 1px solid var(--color-border);
  transform: translateY(-100%);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-base);
}

.mobile-menu.open {
  transform: translateY(0);
  opacity: 1;
  visibility: visible;
}

.mobile-menu-content {
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.mobile-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-base);
  cursor: pointer;
}

.mobile-menu-item:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.mobile-menu-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--spacing-sm) 0;
}

/* 主要内容 */
.main-content {
  min-height: calc(100vh - 72px);
}

/* 响应式设计 */
@media screen and (max-width: 1024px) {
  .navbar-container {
    padding: 0 var(--spacing-lg);
  }
  
  .menu-items {
    gap: var(--spacing-xs);
  }
  
  .menu-item {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}

@media screen and (max-width: 768px) {
  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }
  
  .navbar-container {
    height: 64px;
    padding: 0 var(--spacing-lg);
  }
  
  .navbar-menu {
    display: none;
  }
  
  .navbar-controls {
    display: none;
  }
  
  .mobile-menu-btn {
    display: flex;
  }
  
  .main-content {
    padding-top: 64px;
    min-height: calc(100vh - 64px);
  }
  
  .brand-text {
    display: none;
  }
  
  .icon-circle {
    width: 36px;
    height: 36px;
  }
}

@media screen and (max-width: 480px) {
  .navbar-container {
    padding: 0 var(--spacing-md);
  }
  
  .mobile-menu-content {
    padding: var(--spacing-lg);
  }
}
</style> 