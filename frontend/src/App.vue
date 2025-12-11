<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  BookOpen,
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
    <!-- 重新设计的顶部导航 -->
    <nav class="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/20 shadow-lg transition-all duration-300">
      <div class="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between gap-6">
        <!-- 品牌Logo区域 -->
        <div class="flex-shrink-0">
          <router-link to="/" class="flex items-center gap-3 text-sm no-underline transition-all duration-300 p-2 rounded-lg hover:bg-muted">
            <div class="flex items-center justify-center">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground shadow-md transition-all duration-300 bg-primary">
                <BookOpen :size="20" />
              </div>
            </div>
            <div class="flex flex-col gap-px">
              <span class="text-xl font-bold text-foreground leading-tight">GitHub Weekly</span>
            </div>
          </router-link>
        </div>

        <!-- 中间空白区域，保持Logo和控制器平衡 -->
        <div class="flex-1"></div>

        <!-- 控制区域 -->
        <div class="flex items-center gap-4 flex-shrink-0">
          <!-- 主题切换器 -->
          <div class="flex items-center">
            <button 
              @click="toggleTheme"
              class="flex items-center justify-center w-10 h-10 bg-transparent border border-border rounded-lg cursor-pointer transition-all duration-300 text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            >
              <Sun v-if="isDark" :size="20" />
              <Moon v-else :size="20" />
            </button>
          </div>

          <!-- 视图切换器 -->
          <div class="flex items-center">
            <button 
              @click="fullShow = !fullShow"
              :class="['flex items-center gap-2 h-10 px-4 bg-transparent border rounded-lg cursor-pointer transition-all duration-300 text-sm font-medium', fullShow ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90' : 'border-border text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary']"
              :title="fullShow ? '切换到分页模式' : '切换到滚动模式'"
            >
              <Columns v-if="fullShow" :size="16" class="text-primary-foreground" />
              <LayoutGrid v-else :size="16" class="text-muted-foreground" />
              <span class="text-sm font-medium">{{ fullShow ? '滚动' : '分页' }}</span>
            </button>
          </div>

          <!-- GitHub链接 -->
          <a 
            href="https://github.com/inshub/iohub" 
            target="_blank" 
            class="flex items-center justify-center h-10 px-4 bg-transparent border border-border rounded-lg text-muted-foreground no-underline text-sm font-medium transition-all duration-300 hover:border-primary hover:text-primary hover:bg-primary/10"
            title="访问GitHub仓库"
          >
            <Star :size="20" />
          </a>
        </div>

        <!-- 移动端菜单按钮 -->
        <button class="flex flex-col justify-center items-center w-10 h-10 bg-secondary border border-border rounded-lg cursor-pointer transition-all duration-300 md:hidden hover:bg-primary/10 hover:border-primary" @click="mobileMenuOpen = !mobileMenuOpen">
           <Menu :size="20" />
        </button>
      </div>

      <!-- 移动端菜单 -->
      <div 
        class="absolute top-full left-0 right-0 glass border-t border-border transform -translate-y-full opacity-0 invisible transition-all duration-300 md:hidden" 
        :class="{ 'transform-none opacity-100 visible': mobileMenuOpen }"
      >
        <div class="p-6 flex flex-col gap-2">
          <router-link to="/" class="flex items-center gap-3 p-4 bg-card border border-border rounded-lg no-underline text-foreground font-medium transition-all duration-300 cursor-pointer hover:border-primary hover:bg-primary/10" @click="mobileMenuOpen = false">
            <span class=""><House :size="18" /></span>
            <span class="">首页</span>
          </router-link>
          
          <div class="flex items-center gap-3 p-4 bg-card border border-border rounded-lg no-underline text-foreground font-medium transition-all duration-300 cursor-pointer hover:border-primary hover:bg-primary/10" @click="showArchive = !showArchive">
            <span class=""><Archive :size="18" /></span>
            <span class="">归档</span>
          </div>
          
          <div class="flex items-center gap-3 p-4 bg-card border border-border rounded-lg no-underline text-foreground font-medium transition-all duration-300 cursor-pointer hover:border-primary hover:bg-primary/10" @click="showStats = !showStats">
            <span class=""><BarChart2 :size="18" /></span>
            <span class="">统计</span>
          </div>
          
          <div class="h-px bg-border my-2"></div>
          
          <a href="https://github.com/inshub/iohub" target="_blank" class="flex items-center gap-3 p-4 bg-card border border-border rounded-lg no-underline text-foreground font-medium transition-all duration-300 cursor-pointer hover:border-primary hover:bg-primary/10">
            <span class=""><Star :size="18" /></span>
            <span class="">Star on GitHub</span>
          </a>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="min-h-[calc(100vh-60px)] pt-[60px] md:min-h-[calc(100vh-68px)] md:pt-0">
      <router-view v-model:fullShow="fullShow"></router-view>
    </main>
  </div>
</template>

 
