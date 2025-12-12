<template>
  <div class="max-w-full mx-auto bg-background h-full" :style="{minHeight:fullShow?'calc(100vh - 100px)':'auto'}">
    <!-- 简化的搜索区域 -->
    <section class="py-6 px-4 bg-background border-b border-border/50">
      <div class="relative max-w-[600px] mx-auto flex items-center bg-card border border-border rounded-xl p-1 shadow-lg transition-all duration-300 focus-within:border-primary focus-within:shadow-primary/30">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <i data-lucide="search" class="w-5 h-5 text-muted-foreground"></i>
        </div>
        <input 
          v-model="searchQuery" 
          @focus="showSuggestions = true"
          @blur="hideSuggestions"
          @keydown="handleSearchKeydown"
          placeholder="搜索技术、框架、工具..."
          class="w-full pl-10 pr-10 py-2 border-none outline-none bg-transparent text-card-foreground text-base font-primary"
          ref="searchInput"
          role="searchbox"
          aria-label="搜索文章"
        >
        <button 
          v-if="searchQuery" 
          @click="clearSearch"
          class="absolute inset-y-0 right-0 pr-3 flex items-center justify-center w-8 h-8 bg-secondary border-none rounded-lg text-muted-foreground cursor-pointer transition-all duration-300 mr-1 hover:bg-primary/10 hover:text-primary"
          aria-label="清除搜索"
          title="清除搜索"
        >
          <i data-lucide="x" class="w-5 h-5 text-muted-foreground"></i>
        </button>
        
        <!-- 搜索建议下拉框 -->
        <div 
          v-if="showSuggestions && searchSuggestions.length" 
          class="absolute z-[1000] w-full mt-1 bg-card/90 backdrop-blur-xl border border-border/30 rounded-lg shadow-lg overflow-hidden animate-slide-in-down dark:bg-card/90 dark:border-border/10 dark:shadow-xl"
          role="listbox"
          aria-label="搜索建议"
        >
          <div 
            v-for="(suggestion, index) in searchSuggestions" 
            :key="suggestion"
            @mousedown="selectSuggestion(suggestion)"
            :class="['flex items-center gap-3 px-4 py-2 cursor-pointer transition-all duration-300 border-b border-border/50 relative overflow-hidden hover:bg-muted hover:translate-x-1 last:border-b-0', { 'bg-muted': selectedSuggestionIndex === index }]"
            role="option"
          >
            <div class="flex items-center justify-center text-muted-foreground">
              <i data-lucide="search" class="w-4 h-4 mr-2 text-muted-foreground"></i>
              <span class="flex-1 text-sm text-foreground" v-html="highlightSuggestion(suggestion)"></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 重新设计的文章网格 -->
    <section class="p-2 sm:p-3 md:p-4 lg:px-6 lg:py-4 max-w-7xl mx-auto">
      <main 
        class="articles-main"
        :class="{ 'hide-scrollbar': props.fullShow }"
        :style="{
          overflowY: props.fullShow ? 'auto' : 'hidden',
          height: props.fullShow ? 'calc(100vh - 180px)' : 'auto'
        }" 
        v-on:scrollend="scorllEnd"
      >
        <!-- 骨架屏 - 初始加载时显示 -->
        <div v-if="isInitialLoading" class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
          <div 
            v-for="n in 6" 
            :key="`skeleton-${n}`"
            class="bg-card border rounded-xl overflow-hidden shadow-sm"
          >
            <div class="w-full h-48 skeleton"></div>
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <div class="h-4 w-1/4 skeleton"></div>
                <div class="flex gap-2">
                  <div class="h-4 w-12 skeleton"></div>
                  <div class="h-4 w-12 skeleton"></div>
                </div>
              </div>
              <div class="h-6 w-3/4 mb-2 skeleton"></div>
              <div class="h-4 w-full mb-1 skeleton"></div>
              <div class="h-4 w-full mb-1 skeleton"></div>
              <div class="h-4 w-1/2 skeleton"></div>
            </div>
            <div class="px-6 pt-4 pb-6 border-t border-border/50">
              <div class="h-8 w-24 skeleton"></div>
            </div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="hasError" class="text-center py-20">
            <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto text-destructive mb-4"></i>
            <h3 class="text-lg font-semibold text-destructive">{{ errorMessage }}</h3>
            <p class="text-muted-foreground mt-2">请检查网络连接后重试</p>
            <button @click="retryLoad" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <i data-lucide="refresh-cw" class="w-4 h-4 mr-2"></i>
              重试
            </button>
        </div>

        <!-- 文章列表 -->
        <div v-else class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3 lg:gap-8">
          <article 
            class="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col mb-6 sm:rounded-lg sm:mb-3 md:hover:shadow-md md:mb-4 will-change-transform will-change-shadow"
            v-for="article in paginatedArticles" 
            :key="article.id"
            role="article"
            :aria-labelledby="`article-title-${article.id}`"
          >
            <router-link :to="{ name: 'article', params: { id: article.id }}" @click="saveScrollState" class="relative w-full h-56 block overflow-hidden rounded-lg bg-muted" v-if="getFirstImage(article.content)">
              <img 
                class="w-full h-48 object-cover transition-transform duration-300 hover:scale-105 skeleton"
                :src="getFirstImage(article.content)"
                :alt="article.title" 
                @load="handleImageLoad"
                @error="handleImageError"
                role="img"
              >
            </router-link>
            
            <div class="p-6 flex-grow flex flex-col">
                <div class="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span class="font-medium">{{ formatDate(article.created_at) }}</span>
                    <div class="flex gap-2">
                        <span v-for="label in article.labels.slice(0, 2)" :key="label" class="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded-md text-xs font-semibold">
                            <Calendar v-if="label === 'weekly'" class="w-3 h-3" />
                            {{ label }}
                        </span>
                    </div>
                </div>
                <h3 class="text-xl font-bold mb-4 leading-tight flex-grow">
                    <router-link 
                    :to="{ name: 'article', params: { id: article.id }}"
                    class="hover:text-primary transition-colors text-foreground no-underline line-clamp-2"
                    @click="saveScrollState"
                    >
                    {{ article.title }}
                    </router-link>
                </h3>
                <p class="text-base text-muted-foreground leading-relaxed mt-2 line-clamp-3">{{ getArticleExcerpt(article.content) }}</p>
            </div>
            
            <div class="px-6 pt-4 pb-6 border-t border-border/50">
              <router-link 
                :to="{ name: 'article', params: { id: article.id }}" 
                class="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                @click="saveScrollState"
              >
                阅读全文
                <i data-lucide="arrow-right" class="ml-1 w-4 h-4"></i>
              </router-link>
            </div>
          </article>
        </div>

        <!-- 分页控制 -->
        <div class="py-6 flex justify-center" v-if="totalPages > 1 && !fullShow && !isInitialLoading">
          <nav class="flex justify-center items-center gap-3 px-6 py-3 bg-card/80 backdrop-blur-xl border border-border/30 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:bg-card/90">
            <button
              class="inline-flex items-center gap-2 px-5 py-2.5 border border-border/50 rounded-lg bg-card text-foreground no-underline font-medium text-sm transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
              上一页
            </button>
            
            <div class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
              <span class="text-sm text-muted-foreground">第</span>
              <span class="text-primary font-bold text-lg">{{ currentPage }}</span>
              <span class="text-sm text-muted-foreground">/</span>
              <span class="text-muted-foreground font-semibold">{{ totalPages }}</span>
              <span class="text-sm text-muted-foreground">页</span>
            </div>
            
            <button
              class="inline-flex items-center gap-2 px-5 py-2.5 border border-border/50 rounded-lg bg-card text-foreground no-underline font-medium text-sm transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一页
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </nav>
        </div>
        
        <!-- 无限滚动加载状态 -->
        <div v-if="props.fullShow && !isInitialLoading" class="py-12 text-center">
          <div v-if="isLoading" class="flex flex-col items-center gap-4 text-muted-foreground">
            <i data-lucide="loader" class="w-8 h-8 border-3 border-border border-t-primary rounded-full animate-spin"></i>
            <span class="text-base font-medium">加载更多...</span>
          </div>
          
          <div v-else-if="hasError" class="text-destructive">
            <span class="text-base font-medium">加载失败</span>
            <button @click="retryLoad" class="ml-2 underline text-base font-medium">重试</button>
          </div>
          
          <div v-else-if="!hasMoreData && paginatedArticles.length > 0" class="flex flex-col items-center gap-3 py-8 text-muted-foreground text-sm font-medium">
            已经到底了
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar } from 'lucide-vue-next'
import articles from '../data/articles.json'

const props = defineProps<{
  fullShow: boolean
}>()

const emit = defineEmits(['update:fullShow'])

// 初始化路由
const router = useRouter()

const searchQuery = ref('')
const currentPage = ref(1)
const timeSeed = ref(null as NodeJS.Timeout | null)
const pageSize = 6

// 加载状态管理
const isLoading = ref(false)
const isInitialLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const hasMoreData = ref(true)

// 智能搜索相关状态
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)
const searchContainer = ref<HTMLElement | null>(null)
const searchInput = ref<HTMLInputElement | null>(null)

// 处理图片加载完成
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.classList.remove('skeleton');
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  img.classList.remove('skeleton');
  img.style.display = 'none'; 
}

// 更新搜索输入框的aria-expanded属性
watch(showSuggestions, (newValue) => {
  if (searchInput.value) {
    searchInput.value.setAttribute('aria-expanded', newValue.toString())
  }
})

// 跳过链接功能（可访问性）
const skipToMain = () => {
  const mainContent = document.querySelector('main')
  if (mainContent) {
    mainContent.focus()
    mainContent.scrollIntoView()
  }
}

const filteredArticles = computed(() => {
  if (!searchQuery.value) return articles
  
  const query = searchQuery.value.toLowerCase()
  return articles.filter(article => {
    const title = article.title || ''
    const content = article.content || ''
    return title.toLowerCase().includes(query) || content.toLowerCase().includes(query)
  })
})

// 模拟数据加载
const loadMoreArticles = async () => {
  if (isLoading.value || !hasMoreData.value) return
  
  isLoading.value = true
  hasError.value = false
  
  try {
    // 模拟API调用延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 检查是否还有更多数据
    const totalAvailable = filteredArticles.value.length
    const currentLoaded = pageSize * currentPage.value
    
    if (currentLoaded >= totalAvailable) {
      hasMoreData.value = false
    } else {
      currentPage.value++
    }
    
  } catch (error) {
    hasError.value = true
    errorMessage.value = '加载失败，请重试'
    console.error('加载文章失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 初始化数据加载
const initializeData = async () => {
  isInitialLoading.value = true
  try {
    // 模拟初始加载延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    hasMoreData.value = filteredArticles.value.length > pageSize
  } catch (error) {
    hasError.value = true
    errorMessage.value = '数据加载失败'
  } finally {
    isInitialLoading.value = false
  }
}

// 获取所有分类（用于搜索建议）
const categories = computed(() => {
  const allLabels = articles.flatMap(article => article.labels)
  return [...new Set(allLabels)].sort()
})

// 搜索建议
const searchSuggestions = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return []
  
  const query = searchQuery.value.toLowerCase()
  const suggestions = new Set<string>()
  
  // 从标题中提取建议
  articles.forEach(article => {
    const title = article.title.toLowerCase()
    if (title.includes(query)) {
      // 提取匹配的关键词
      const words = article.title.split(/[\s\-_\.]+/)
      words.forEach(word => {
        if (word.toLowerCase().includes(query) && word.length > 2) {
          suggestions.add(word)
        }
      })
    }
  })
  
  // 从标签中提取建议
  categories.value.forEach(category => {
    if (category.toLowerCase().includes(query)) {
      suggestions.add(category)
    }
  })
  
  // 预定义的热门搜索词
  const popularTerms = ['Vue', 'React', 'JavaScript', 'Python', 'AI', 'Docker', 'Kubernetes', 'Node.js', 'TypeScript', 'Go']
  popularTerms.forEach(term => {
    if (term.toLowerCase().includes(query)) {
      suggestions.add(term)
    }
  })
  
  return Array.from(suggestions).slice(0, 8)
})

// 高亮搜索建议
const highlightSuggestion = (suggestion: string) => {
  if (!searchQuery.value) return suggestion
  
  const query = searchQuery.value
  const regex = new RegExp(`(${query})`, 'gi')
  return suggestion.replace(regex, '<mark class="bg-primary/10 text-primary px-1 rounded-sm font-semibold">$1</mark>')
}

// 搜索相关方法
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
  }, 200) // 延迟以允许点击建议
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (!showSuggestions.value || !searchSuggestions.value.length) return
  
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        searchSuggestions.value.length - 1
      )
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

// 特色文章（用于Hero区域展示）
const featuredArticles = computed(() => {
  return articles.slice(0, 6)
})

const totalPages = computed(() => 
  Math.ceil(filteredArticles.value.length / pageSize)
)

const paginatedArticles = computed(() => {
  let [start,end] = [0,0];
  if(props.fullShow) {
    end = pageSize + (currentPage.value - 1) * pageSize
  } else {
    start = (currentPage.value - 1) * pageSize
    end = start + pageSize
  }
  
  return filteredArticles.value.slice(start, end)
})

const scorllEnd = () => {
  if (!props.fullShow) return
  
  // 防抖处理
  if (timeSeed.value) {
    clearTimeout(timeSeed.value)
  }
  
  timeSeed.value = setTimeout(async () => {
    const container = document.querySelector('.articles-main') as HTMLElement
    if (!container) return
    
    const scrollTop = container.scrollTop
    const scrollHeight = container.scrollHeight
    const clientHeight = container.clientHeight
    
    // 当滚动到底部附近时触发加载
    const threshold = 200 // 提前200px开始加载
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      await loadMoreArticles()
    }
  }, 300)
}

// 重试加载函数
const retryLoad = () => {
  hasError.value = false
  loadMoreArticles()
}

// 预加载关键图片
const preloadCriticalImages = () => {
  // 预加载前6张图片
  paginatedArticles.value.slice(0, 6).forEach(article => {
    const imageUrl = getFirstImage(article.content)
    if (imageUrl) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = imageUrl
      document.head.appendChild(link)
    }
  })
}

// 监听文章变化，设置图片懒加载
watch(paginatedArticles, async () => {
  await nextTick()
}, { flush: 'post', immediate: true })

watch(searchQuery, () => {
  currentPage.value = 1
  hasMoreData.value = true
  hasError.value = false
})

const getFirstImage = (content: string) => {
  try {
    // 确保 content 存在且为字符串
    if (!content || typeof content !== 'string') {
      return null
    }

    // 提取图片 URL 的函数
    const extractUrl = (pattern: RegExp, str: string): string | null => {
      const matches = str.match(pattern)
      return matches && matches[1] ? matches[1] : null
    }

    // 验证 URL 是否有效
    const isValidUrl = (url: string): boolean => {
      return url.includes('assets/') || url.startsWith('http')
    }

    // 尝试匹配 Markdown 图片
    const mdPattern = /!\[.*?\]\((.*?)\)/g
    const mdMatches = content.match(mdPattern)
    if (mdMatches) {
      for (const match of mdMatches) {
        const url = extractUrl(/!\[.*?\]\((.*?)\)/, match)
        if (url && isValidUrl(url)) {
          return url
        }
      }
    }

    // 尝试匹配 HTML 图片
    const htmlPattern = /<img[^>]+src="([^">]+)"/g
    const htmlMatches = content.match(htmlPattern)
    if (htmlMatches) {
      for (const match of htmlMatches) {
        const url = extractUrl(/src="([^">]+)"/, match)
        if (url && isValidUrl(url)) {
          return url
        }
      }
    }

    return null
  } catch (error) {
    // 只在开发环境下打印详细错误信息
    if (process.env.NODE_ENV === 'development') {
      console.error('解析图片URL时出错:', error)
    }
    return null
  }
}

const getArticleExcerpt = (content: string) => {
  try {
    if (!content) return ''
    
    const textContent = content
      .replace(/!\[.*?\]\(.*?\)/g, '')  // 移除 Markdown 图片
      .replace(/```[\s\S]*?```/g, '')   // 移除代码块
      .replace(/\[.*?\]\(.*?\)/g, '')   // 移除链接
      .replace(/#+ /g, '')              // 移除标题标记
      .replace(/\*\*/g, '')             // 移除加粗标记
      .trim()
    
    // 分段并过滤
    const paragraphs = textContent
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)        // 移除空行
      .filter(p => !p.includes('---'))  // 移除分隔线
      .filter(p => p.length > 30)       // 保留较长的段落
    
    if (paragraphs.length === 0) return ''
    
    // 查找包含关键词的段落
    const keywords = ['介绍', '简介', '概述', '背景', '主要', '核心', '特点', '功能']
    const importantParagraph = paragraphs.find(p => 
      keywords.some(keyword => p.includes(keyword))
    )
    
    const selectedParagraph = importantParagraph || paragraphs[0] || ''
    
    // 截取合适长度
    return selectedParagraph.length > 120 
      ? selectedParagraph.slice(0, 120) + '...'
      : selectedParagraph
      
  } catch (error) {
    console.error('提取文章摘要时出错:', error)
    return ''
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 滚动位置记忆功能
const mainContainer = ref<HTMLElement | null>(null)

// 保存滚动位置和当前页码
const saveScrollState = () => {
  let scrollPosition = 0
  
  if (props.fullShow) {
    // 滚动模式下，获取正确的滚动容器 
    const articlesMain = document.querySelector('.articles-main') as HTMLElement
    if (articlesMain) {
      scrollPosition = articlesMain.scrollTop
    }
  } else {
    // 分页模式下，使用window滚动
    scrollPosition = window.pageYOffset || document.documentElement.scrollTop
  }
  
  const state = {
    scrollPosition: scrollPosition,
    currentPage: currentPage.value,
    searchQuery: searchQuery.value,
    timestamp: Date.now(),
    fullShow: props.fullShow
  }
  console.log('💾 Saving scroll state:', state)
  sessionStorage.setItem('iohub-scroll-state', JSON.stringify(state))
}

// 恢复滚动位置和当前页码
const restoreScrollState = async () => {
  const savedState = sessionStorage.getItem('iohub-scroll-state')
  if (savedState) {
    try {
      const state = JSON.parse(savedState)
      const isRecent = (Date.now() - state.timestamp) < 30 * 60 * 1000 // 30分钟内
      
      if (isRecent) {
        // 恢复搜索查询
        if (state.searchQuery) {
          searchQuery.value = state.searchQuery
        }
        
        // 恢复页码
        if (state.currentPage && state.currentPage > 0) {
          currentPage.value = state.currentPage
        }
        
        // 等待DOM更新和数据加载完成后恢复滚动位置
        await nextTick()
        
        // 在滚动模式下，需要确保加载足够的内容来恢复位置
        if (props.fullShow && state.currentPage > 1) {
          console.log(`Need to load content up to page ${state.currentPage} for scroll position ${state.scrollPosition}`)
          
          // 强制加载所有需要的内容，不依赖异步加载机制
          const forceLoadContent = async () => {
            let loadAttempts = 0
            const maxLoadAttempts = 20
            
            // 直接设置目标页码，让 paginatedArticles 计算显示所有需要的内容
            const originalPage = currentPage.value
            currentPage.value = state.currentPage
            
            // 等待内容更新
            await nextTick()
            
            console.log(`Content loading completed. Page set to: ${currentPage.value}, Articles count: ${paginatedArticles.value.length}`)
          }
          
          await forceLoadContent()
        }
        
        // 改进的滚动位置恢复算法
        const attemptScrollRestore = async (attempts = 0) => {
          const maxAttempts = 40
          
          if (attempts >= maxAttempts) {
            console.warn(`Failed to restore scroll position after ${maxAttempts} attempts`)
            return
          }
          
          if (state.scrollPosition > 0) {
            if (props.fullShow) {
              const mainContainer = document.querySelector('.articles-main') as HTMLElement
              
              if (mainContainer) {
                const currentScrollHeight = mainContainer.scrollHeight
                const clientHeight = mainContainer.clientHeight
                const targetPosition = state.scrollPosition
                
                console.log(`Attempt ${attempts + 1}: Container height=${currentScrollHeight}, Target=${targetPosition}, Client=${clientHeight}`)
                
                // 检查是否有足够的内容来滚动
                if (currentScrollHeight > clientHeight) {
                  // 计算可滚动的最大位置
                  const maxScrollTop = currentScrollHeight - clientHeight
                  const scrollToPosition = Math.min(targetPosition, maxScrollTop)
                  
                  // 设置滚动位置
                  mainContainer.scrollTop = scrollToPosition
                  
                  // 等待滚动完成
                  await new Promise(resolve => setTimeout(resolve, 50))
                  
                  // 验证滚动是否成功 - 放宽验证条件
                  const actualPosition = mainContainer.scrollTop
                  const tolerance = Math.max(100, targetPosition * 0.05) // 5%容错或最小100px
                  
                  if (Math.abs(actualPosition - scrollToPosition) <= tolerance || 
                      (scrollToPosition === maxScrollTop && actualPosition >= maxScrollTop - 50)) {
                    console.log(`✅ Scroll position restored successfully: ${actualPosition} (target: ${targetPosition})`)
                    return
                  }
                  
                  console.log(`❌ Scroll verification failed: actual=${actualPosition}, expected=${scrollToPosition}, tolerance=${tolerance}`)
                }
                
                // 如果内容高度不足，等待更多渲染
                if (currentScrollHeight <= targetPosition + clientHeight) {
                  console.log('Content height insufficient, waiting for more rendering...')
                  // 给更多时间让内容渲染
                  await new Promise(resolve => setTimeout(resolve, 200))
                }
              }
            } else {
              // 分页模式的滚动恢复
              const targetPosition = Math.min(state.scrollPosition, document.body.scrollHeight - window.innerHeight)
              
              if (document.body.scrollHeight >= targetPosition + window.innerHeight) {
                window.scrollTo(0, targetPosition)
                
                if (Math.abs(window.pageYOffset - targetPosition) < 50) {
                  console.log('Window scroll position restored successfully:', targetPosition)
                  return
                }
              }
            }
          }
          
          // 使用渐进式延迟重试
          const delay = attempts < 5 ? 50 : attempts < 15 ? 100 : attempts < 25 ? 200 : 300
          setTimeout(() => attemptScrollRestore(attempts + 1), delay)
        }
        
        // 延迟开始尝试，确保DOM完全渲染
        setTimeout(() => {
          console.log('🔄 Starting scroll position restoration attempts...')
          attemptScrollRestore()
        }, 150) // 减少延迟，让恢复更快
      } else {
        console.log('❌ Saved state is too old, ignoring')
      }
    } catch (error) {
      console.error('❌ Failed to restore scroll state:', error)
    }
  } else {
    console.log('ℹ️ No saved scroll state found')
  }
}

// 定期保存滚动位置
let saveScrollTimer: NodeJS.Timeout | null = null
const throttledSaveScroll = () => {
  if (saveScrollTimer) {
    clearTimeout(saveScrollTimer)
  }
  saveScrollTimer = setTimeout(saveScrollState, 500)
}

// 监听滚动事件
const handleScroll = () => {
  throttledSaveScroll()
}

// 页面滚动事件处理（非fullShow模式）
const handleWindowScroll = () => {
  if (!props.fullShow) {
    throttledSaveScroll()
  }
}

// 页码变化时保存状态
watch(currentPage, () => {
  saveScrollState()
})

// 搜索变化时清除状态
watch(searchQuery, () => {
  sessionStorage.removeItem('iohub-scroll-state')
})

// 组件挂载时设置事件监听和恢复状态
onMounted(async () => {
  await nextTick()
  
  // 滚动模式下监听 .articles-main，分页模式下监听 window
  const articlesMain = document.querySelector('.articles-main') as HTMLElement
  if (articlesMain) {
    articlesMain.addEventListener('scroll', handleScroll, { passive: true })
    console.log('📡 Added scroll listener to .articles-main')
  }
  
  // 为非fullShow模式添加window滚动监听
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  
  // 先初始化数据加载
  await initializeData()
  
  // 等待DOM完全更新后恢复滚动状态 - 增加更多延迟确保内容渲染完成
  await nextTick()
  // 使用更长的延迟确保所有内容都已渲染
  setTimeout(async () => {
    await restoreScrollState()
  }, 100)
  
  // 预加载关键图片
  await nextTick()
  preloadCriticalImages()
})

// 组件卸载时清理事件监听
onBeforeUnmount(() => {
  // 清理滚动事件监听
  const articlesMain = document.querySelector('.articles-main') as HTMLElement
  if (articlesMain) {
    articlesMain.removeEventListener('scroll', handleScroll)
  }
  window.removeEventListener('scroll', handleWindowScroll)
  
  if (saveScrollTimer) {
    clearTimeout(saveScrollTimer)
  }
  saveScrollState() // 保存最终状态
})
</script>



