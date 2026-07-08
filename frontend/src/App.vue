<script setup lang="ts">
import { computed, nextTick, provide, ref, watch, onMounted } from 'vue'
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
  Search,
  X,
} from 'lucide-vue-next';
import articles from './data/articles.json'

const fullShow = ref(true)
const mobileMenuOpen = ref(false)
const showArchive = ref(false)
const showStats = ref(false)
const isDark = ref(false)
const searchQuery = ref('')
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)
const searchInput = ref<HTMLInputElement | null>(null)

provide('iohubSearchQuery', searchQuery)

const categories = computed(() => {
  const allLabels = articles.flatMap(article => article.labels)
  return [...new Set(allLabels)].sort()
})

const searchSuggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return []
  const query = searchQuery.value.toLowerCase()
  const suggestions = new Set<string>()

  articles.forEach(article => {
    const title = article.title.toLowerCase()
    if (title.includes(query)) {
      article.title.split(/[\s\-_\.]+/).forEach(word => {
        if (word.toLowerCase().includes(query) && word.length > 2) {
          suggestions.add(word)
        }
      })
    }
  })

  categories.value.forEach(category => {
    if (category.toLowerCase().includes(query)) suggestions.add(category)
  })

  const popularTerms = ['Vue', 'React', 'JavaScript', 'Python', 'AI', 'Docker', 'Kubernetes', 'Node.js', 'TypeScript', 'Go']
  popularTerms.forEach(term => {
    if (term.toLowerCase().includes(query)) suggestions.add(term)
  })

  return Array.from(suggestions).slice(0, 8)
})

const clearSearch = () => {
  searchQuery.value = ''
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

const selectSuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }, 160)
}

const highlightSuggestion = (suggestion: string) => {
  if (!searchQuery.value) return suggestion
  const escaped = searchQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return suggestion.replace(regex, '<mark class="io-search-mark">$1</mark>')
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value || !searchSuggestions.value.length) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedSuggestionIndex.value = Math.min(selectedSuggestionIndex.value + 1, searchSuggestions.value.length - 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
      break
    case 'Enter':
      if (selectedSuggestionIndex.value >= 0) {
        event.preventDefault()
        selectSuggestion(searchSuggestions.value[selectedSuggestionIndex.value])
      }
      break
    case 'Escape':
      showSuggestions.value = false
      selectedSuggestionIndex.value = -1
      break
  }
}

watch(showSuggestions, async (newValue) => {
  await nextTick()
  searchInput.value?.setAttribute('aria-expanded', newValue.toString())
})

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
              <img src="/logo.png" alt="" width="42" height="42">
            </span>
            <span class="io-brand-copy">
              <span class="io-brand-main">IOHub</span>
              <span class="io-brand-sub mono">GITHUB WEEKLY</span>
            </span>
          </router-link>
        </div>

        <div class="io-nav-search" aria-label="站内搜索">
        <div class="io-global-search" :class="{ active: showSuggestions && searchSuggestions.length }">
          <Search class="io-search-icon" aria-hidden="true" />
          <input
            v-model="searchQuery"
            @focus="showSuggestions = true"
            @blur="hideSuggestions"
            @keydown="handleSearchKeydown"
            placeholder="搜索技术、框架、工具..."
            ref="searchInput"
            role="searchbox"
            aria-label="搜索文章"
            aria-autocomplete="list"
          >
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="io-search-clear"
            aria-label="清除搜索"
            title="清除搜索"
          >
            <X :size="16" />
          </button>

          <div
            v-if="showSuggestions && searchSuggestions.length"
            class="io-search-suggestions"
            role="listbox"
            aria-label="搜索建议"
          >
            <button
              v-for="(suggestion, index) in searchSuggestions"
              :key="suggestion"
              type="button"
              :class="['io-search-option', { active: selectedSuggestionIndex === index }]"
              @mousedown.prevent="selectSuggestion(suggestion)"
              role="option"
            >
              <Search :size="15" aria-hidden="true" />
              <span v-html="highlightSuggestion(suggestion)"></span>
            </button>
          </div>
        </div>
        </div>

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

 
