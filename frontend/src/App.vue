<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Sun,
  Moon,
  Columns,
  LayoutGrid,
  Menu,
  House,
  Archive,
  BarChart2,
  Star,
} from 'lucide-vue-next';

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
  });
})
</script>

<template>
  <div id="app">
    <nav class="io-site-header">
      <div class="io-nav-inner">
        <!-- 品牌Logo区域 -->
        <div class="io-brand-wrap">
          <router-link to="/" class="io-brand">
            <span class="io-logo-mark" aria-hidden="true">
              <span class="io-logo-i"></span>
              <span class="io-logo-o"></span>
              <span class="io-logo-scan"></span>
            </span>
            <span class="io-brand-copy">
              <span class="io-brand-main">IOHub</span>
              <span class="io-brand-sub mono">GITHUB WEEKLY</span>
            </span>
          </router-link>
        </div>

        <!-- 中间空白区域，保持Logo和控制器平衡 -->
        <div class="io-nav-spacer"></div>

        <!-- 控制区域 -->
        <div class="io-nav-actions">
          <!-- 主题切换器 -->
          <div class="io-action-group">
            <button 
              @click="toggleTheme"
              class="io-icon-button"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            >
              <Sun v-if="isDark" :size="20" />
              <Moon v-else :size="20" />
            </button>
          </div>

          <!-- 视图切换器 -->
          <div class="io-action-group">
            <button 
              @click="fullShow = !fullShow"
              :class="['io-segment-button', { active: fullShow }]"
              :title="fullShow ? '切换到分页模式' : '切换到滚动模式'"
            >
              <Columns v-if="fullShow" :size="16" />
              <LayoutGrid v-else :size="16" />
              <span>{{ fullShow ? '滚动' : '分页' }}</span>
            </button>
          </div>

          <!-- GitHub链接 -->
          <a 
            href="https://github.com/inshub/iohub" 
            target="_blank" 
            class="io-icon-button"
            title="访问GitHub仓库"
          >
            <Star :size="20" />
          </a>
        </div>

        <!-- 移动端菜单按钮 -->
        <button class="io-icon-button io-mobile-trigger" @click="mobileMenuOpen = !mobileMenuOpen" title="打开菜单">
           <Menu :size="20" />
        </button>
      </div>

      <!-- 移动端菜单 -->
      <div 
        class="io-mobile-menu" 
        :class="{ open: mobileMenuOpen }"
      >
        <div class="io-mobile-panel">
          <router-link to="/" class="io-mobile-item" @click="mobileMenuOpen = false">
            <House :size="18" />
            <span>首页</span>
          </router-link>
          
          <div class="io-mobile-item" @click="showArchive = !showArchive">
            <Archive :size="18" />
            <span>归档</span>
          </div>
          
          <div class="io-mobile-item" @click="showStats = !showStats">
            <BarChart2 :size="18" />
            <span>统计</span>
          </div>
          
          <div class="io-mobile-rule"></div>
          
          <a href="https://github.com/inshub/iohub" target="_blank" class="io-mobile-item">
            <Star :size="18" />
            <span>Star on GitHub</span>
          </a>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="io-main-shell">
      <router-view v-model:fullShow="fullShow"></router-view>
    </main>
  </div>
</template>

 
