<template>
  <div class="home-container" :style="{minHeight:fullShow?'calc(100vh - 100px)':'auto'}">
    <!-- 简化的搜索区域 -->
    <section class="search-section">
      <div class="search-container" ref="searchContainer">
        <div class="search-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
        </div>
        <input 
          v-model="searchQuery" 
          @focus="showSuggestions = true"
          @blur="hideSuggestions"
          @keydown="handleSearchKeydown"
          placeholder="搜索技术、框架、工具..."
          class="search-input"
          ref="searchInput"
          role="searchbox"
          aria-label="搜索文章"
          aria-expanded="false"
          aria-autocomplete="list"
          :aria-activedescendant="selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : ''"
        >
        <button 
          v-if="searchQuery" 
          @click="clearSearch"
          class="search-clear"
          aria-label="清除搜索"
          title="清除搜索"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        
        <!-- 搜索建议下拉框 -->
        <div 
          v-if="showSuggestions && searchSuggestions.length" 
          class="search-suggestions"
          role="listbox"
          aria-label="搜索建议"
        >
          <div 
            v-for="(suggestion, index) in searchSuggestions" 
            :key="suggestion"
            :id="`suggestion-${index}`"
            @mousedown="selectSuggestion(suggestion)"
            :class="['suggestion-item', { active: selectedSuggestionIndex === index }]"
            role="option"
            :aria-selected="selectedSuggestionIndex === index"
            tabindex="-1"
          >
            <div class="suggestion-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
            </div>
            <div class="suggestion-text" v-html="highlightSuggestion(suggestion)"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 重新设计的文章网格 -->
    <section class="articles-section">
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
        <div v-if="isInitialLoading" class="articles-grid">
          <div 
            v-for="n in 6" 
            :key="`skeleton-${n}`"
            class="skeleton-card"
          >
            <div class="skeleton-meta">
              <div class="skeleton skeleton-tag"></div>
              <div class="skeleton skeleton-tag"></div>
            </div>
            <div class="skeleton skeleton-image"></div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-text medium"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
            <div class="skeleton skeleton-button"></div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="hasError" class="error-state">
          <div class="error-content">
            <div class="error-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 class="error-title">{{ errorMessage }}</h3>
            <p class="error-description">请检查网络连接后重试</p>
            <button @click="retryLoad" class="btn-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.64A9 9 0 0 1 3.51 15"/>
              </svg>
              重试
            </button>
          </div>
        </div>

        <!-- 文章列表 -->
        <div v-else class="articles-grid">
          <article 
            class="article-card"
            v-for="(article, index) in paginatedArticles" 
            :key="article.id"
            role="article"
            :aria-labelledby="`article-title-${article.id}`"
            :aria-describedby="`article-excerpt-${article.id}`"
            tabindex="0"
            @keydown="handleArticleKeydown($event, article)"
          >
            <!-- 文章卡片头部 -->
            <div class="card-header">
              <div class="card-meta">
                <span class="card-date">{{ formatDate(article.created_at) }}</span>
                <div class="card-labels">
                  <span v-for="label in article.labels.slice(0, 2)" :key="label" class="label-tag">
                    {{ label }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- 预览图片 -->
            <div class="card-image" v-if="getFirstImage(article.content)">
              <img 
                class="lazy"
                :data-src="getFirstImage(article.content)"
                :alt="article.title" 
                @load="handleImageLoad"
                :style="{ objectFit: 'cover' }"
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23f3f4f6'/%3E%3C/svg%3E"
                loading="lazy"
                role="img"
                :aria-label="`${article.title}的预览图片`"
              >
              <div class="image-overlay" aria-hidden="true"></div>
            </div>
            
            <!-- 文章内容 -->
            <div class="card-content">
              <h3 class="card-title" :id="`article-title-${article.id}`">
                <router-link 
                  :to="{ name: 'article', params: { id: article.id }}"
                  :aria-label="`阅读文章：${article.title}`"
                  @click="saveScrollState"
                >
                  {{ article.title }}
                </router-link>
              </h3>
              <p class="card-excerpt" :id="`article-excerpt-${article.id}`">{{ getArticleExcerpt(article.content) }}</p>
            </div>
            
            <!-- 文章底部 -->
            <div class="card-footer">
              <router-link 
                :to="{ name: 'article', params: { id: article.id }}" 
                class="btn-minimal"
                @click="saveScrollState"
              >
                阅读全文
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </router-link>
            </div>
          </article>
        </div>

        <!-- 分页控制 -->
        <div class="pagination-wrapper" v-if="totalPages > 1 && !fullShow && !isInitialLoading">
          <nav class="pagination" role="navigation" aria-label="文章分页导航">
            <button 
              class="page-btn btn-secondary" 
              :disabled="currentPage === 1"
              @click="currentPage--"
              :aria-label="`转到第${currentPage - 1}页`"
              aria-describedby="pagination-info"
            >
              ← 上一页
            </button>
            
            <div class="page-info" id="pagination-info" aria-live="polite">
              <span class="current-page">{{ currentPage }}</span>
              <span class="page-separator">/</span>
              <span class="total-pages">{{ totalPages }}</span>
            </div>
            
            <button 
              class="page-btn btn-secondary" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
              :aria-label="`转到第${currentPage + 1}页`"
              aria-describedby="pagination-info"
            >
              下一页 →
            </button>
          </nav>
        </div>
        
        <!-- 无限滚动加载状态 -->
        <div v-if="props.fullShow && !isInitialLoading" class="infinite-scroll-status">
          <!-- 加载中 -->
          <div v-if="isLoading" class="loading-section">
            <div class="loading-content">
              <div class="loading-spinner"></div>
              <span class="loading-text">加载更多精彩内容...</span>
            </div>
          </div>
          
          <!-- 加载错误 -->
          <div v-else-if="hasError" class="loading-error">
            <div class="error-content">
              <span class="error-text">加载失败</span>
              <button @click="retryLoad" class="btn-minimal">
                重试
              </button>
            </div>
          </div>
          
          <!-- 没有更多数据 -->
          <div v-else-if="!hasMoreData && paginatedArticles.length > 0" class="no-more-data">
            <div class="no-more-content">
              <div class="no-more-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              <span class="no-more-text">已经到底了，没有更多内容</span>
            </div>
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
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
const handleImageLoad = () => {
  // 图片加载完成后的处理逻辑
}

// 键盘导航 - 文章卡片
const handleArticleKeydown = (event: KeyboardEvent, article: any) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    // 保存当前状态后导航到文章详情页
    saveScrollState()
    // 使用 router 导航
    router.push(`/article/${article.id}`)
  }
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
  return suggestion.replace(regex, '<mark>$1</mark>')
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

// 图片懒加载相关
const imageObserver = ref<IntersectionObserver | null>(null)
const lazyImages = ref<Set<HTMLImageElement>>(new Set())

// 初始化图片懒加载
const initImageLazyLoading = () => {
  if (!('IntersectionObserver' in window)) return
  
  imageObserver.value = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = img.dataset.src
        
        if (src) {
          img.src = src
          img.removeAttribute('data-src')
          img.classList.remove('lazy')
          img.classList.add('loaded')
          imageObserver.value?.unobserve(img)
          lazyImages.value.delete(img)
        }
      }
    })
  }, {
    rootMargin: '50px 0px',
    threshold: 0.1
  })
}

// 处理图片懒加载
const handleLazyImage = (img: HTMLImageElement) => {
  if (!imageObserver.value) return
  
  lazyImages.value.add(img)
  imageObserver.value.observe(img)
}

// 预加载关键图片
const preloadCriticalImages = () => {
  // 预加载前3张图片
  paginatedArticles.value.slice(0, 3).forEach(article => {
    const imageUrl = getFirstImage(article.content)
    if (imageUrl) {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = imageUrl
      document.head.appendChild(link)
    }
  })
}

// 监听文章变化，设置图片懒加载
watch(paginatedArticles, async () => {
  await nextTick()
  if (imageObserver.value) {
    // 查找所有需要懒加载的图片
    const lazyImgs = document.querySelectorAll('img.lazy')
    lazyImgs.forEach(img => {
      if (!lazyImages.value.has(img as HTMLImageElement)) {
        handleLazyImage(img as HTMLImageElement)
      }
    })
  }
}, { flush: 'post' })

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
  
  // 初始化图片懒加载
  initImageLazyLoading()
  
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
  // 清理图片观察器
  if (imageObserver.value) {
    lazyImages.value.forEach(img => {
      imageObserver.value?.unobserve(img)
    })
    imageObserver.value.disconnect()
    lazyImages.value.clear()
  }
  
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

<style scoped>
/* 简化的搜索区域 */
.home-container {
  max-width: 100%;
  margin: 0 auto;
  background: var(--color-bg-page);
  min-height: calc(100vh - 64px);
}

.search-section {
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-lg);
  background: var(--color-bg-page);
  border-bottom: 1px solid var(--color-border-light);
}

.search-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xs);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-base);
}

.search-container:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: var(--color-text-secondary);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-bg-secondary);
  border: none;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  margin-right: var(--spacing-xs);
}

.search-clear:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

/* 搜索建议下拉框 */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
  margin-top: var(--spacing-xs);
  overflow: hidden;
  z-index: 1000;
  animation: slide-in-down 0.3s ease-out;
}

[data-theme="dark"] .search-suggestions {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  transition: all var(--transition-base);
  border-bottom: 1px solid var(--color-border-light);
  position: relative;
  overflow: hidden;
}

.suggestion-item::before {
  content: '';
  position: absolute;
  left: -100%;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.1), transparent);
  transition: left var(--transition-slow);
}

.suggestion-item:hover::before {
  left: 100%;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: var(--color-primary-light);
  transform: translateX(4px);
}

.suggestion-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.suggestion-text {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--color-text-primary);
}

.suggestion-text mark {
  background: var(--color-primary-light);
  color: var(--color-primary);
  padding: 0 var(--spacing-xs);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-semibold);
}

/* 文章区域布局 */
.articles-section {
  padding: var(--spacing-lg) var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}


.section-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}


/* 简约大气文章网格 */
.articles-grid {
  position: relative;
  width: 100%;
  padding: var(--spacing-xl) 0;
}

/* 文章网格布局 */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: var(--spacing-2xl);
}

.article-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--spacing-xl);
  animation: slide-in-up 0.6s ease-out backwards;
  animation-delay: calc(var(--animation-order, 0) * 0.1s);
  will-change: transform, box-shadow;
}

.article-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary-light);
  transition: all var(--transition-base);
}

.article-card:active {
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.card-header {
  padding: var(--spacing-xl) var(--spacing-xl) 0;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.card-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-medium);
}

.card-labels {
  display: flex;
  gap: var(--spacing-sm);
}

.label-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--color-accent-light);
  color: var(--color-accent);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
}

.card-image {
  position: relative;
  width: 100%;
  height: 220px;
  margin: 0 var(--spacing-xl) var(--spacing-xl);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-tertiary);
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-slow);
}

.article-card:hover .card-image img {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.1) 100%);
}

.card-content {
  padding: 0 var(--spacing-xl) var(--spacing-xl);
}

.card-title {
  margin: 0 0 var(--spacing-lg);
  line-height: 1.3;
}

.card-title a {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  text-decoration: none;
  transition: color var(--transition-base);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-title a:hover {
  color: var(--color-primary);
}

.card-excerpt {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-xl);
  border-top: 1px solid var(--color-border-light);
}


/* 分页样式 - 优化设计 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-4xl);
}

.pagination {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) var(--spacing-2xl);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-2xl);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
}

[data-theme="dark"] .pagination {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
  font-size: var(--font-size-sm);
  transition: all var(--transition-base);
  cursor: pointer;
  box-shadow: var(--shadow-xs);
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: var(--color-text-tertiary);
}

.page-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: var(--font-weight-bold);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary-light);
  border-radius: var(--radius-lg);
}

.current-page {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-extrabold);
}

.page-separator {
  color: var(--color-text-tertiary);
  font-weight: var(--font-weight-normal);
}

.total-pages {
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-semibold);
}

/* 加载状态 */
.loading-section {
  display: flex;
  justify-content: center;
  padding: var(--spacing-3xl) 0;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-lg);
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

/* 错误状态样式 */
.error-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: var(--spacing-2xl);
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-warning);
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.error-description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

/* 无限滚动状态样式 */
.infinite-scroll-status {
  margin-top: var(--spacing-2xl);
}

.loading-error {
  display: flex;
  justify-content: center;
  padding: var(--spacing-xl);
}

.loading-error .error-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.error-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.no-more-data {
  display: flex;
  justify-content: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
}

.no-more-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
  text-align: center;
}

.no-more-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
  opacity: 0.7;
}

.no-more-text {
  font-weight: var(--font-weight-medium);
}

/* 动画 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes floatMove {
  0%, 100% { 
    transform: translateY(0px) translateX(0px) rotate(0deg);
  }
  33% { 
    transform: translateY(-20px) translateX(10px) rotate(1deg);
  }
  66% { 
    transform: translateY(10px) translateX(-5px) rotate(-1deg);
  }
}

@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

/* 响应式设计 */
@media screen and (max-width: 1024px) {
  .articles-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--spacing-xl);
  }
  
  .search-section {
    padding: var(--spacing-lg) var(--spacing-xl);
  }
  
  .articles-section {
    padding: var(--spacing-lg) var(--spacing-xl);
  }
}

@media screen and (max-width: 768px) {
  .search-section {
    padding: var(--spacing-lg);
  }
  
  .articles-section {
    padding: var(--spacing-lg);
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .section-title {
    font-size: var(--font-size-2xl);
  }
  
  .search-container {
    max-width: 100%;
  }
  
  .search-input {
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  /* 文章卡片移动端优化 */
  .article-card {
    margin-bottom: var(--spacing-lg);
  }
  
  .article-card:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-primary-light);
  }
  
  .card-header {
    padding: var(--spacing-lg) var(--spacing-lg) 0;
  }
  
  .card-content {
    padding: var(--spacing-lg);
  }
  
  .card-footer {
    padding: 0 var(--spacing-lg) var(--spacing-lg);
  }
  
  .card-title {
    font-size: var(--font-size-xl);
    line-height: 1.3;
  }
  
  .card-excerpt {
    font-size: var(--font-size-base);
    line-height: 1.5;
  }
  
  /* 分页控制移动端优化 */
  .pagination {
    gap: var(--spacing-sm);
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .page-btn {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: var(--font-size-sm);
    min-width: 44px; /* 确保触摸目标足够大 */
    min-height: 40px;
  }
  
  .page-info {
    order: -1;
    width: 100%;
    text-align: center;
    margin-bottom: var(--spacing-sm);
  }
  
  /* 搜索建议移动端优化 */
  .search-suggestions {
    max-height: 50vh;
    font-size: var(--font-size-base);
  }
  
  .suggestion-item {
    padding: var(--spacing-md) var(--spacing-lg);
    min-height: 40px;
    display: flex;
    align-items: center;
  }
}

@media screen and (max-width: 480px) {
  .search-section {
    padding: var(--spacing-md);
  }
  
  .articles-section {
    padding: var(--spacing-md);
  }
  
  .section-title {
    font-size: var(--font-size-xl);
  }
  
  .articles-grid {
    gap: var(--spacing-md);
  }
  
  .article-card {
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-md);
  }
  
  .card-image {
    height: 180px;
  }
  
  .card-title {
    font-size: var(--font-size-lg);
  }
  
  .card-excerpt {
    font-size: var(--font-size-sm);
    -webkit-line-clamp: 3;
  }
  
  .label-tag {
    font-size: var(--font-size-xs);
    padding: 2px 6px;
  }
  
  /* 骨架屏移动端优化 */
  .skeleton-image {
    height: 180px;
  }
  
  .skeleton-title {
    height: 20px;
  }
  
  .skeleton-text {
    height: 14px;
  }
  
  /* 加载状态移动端优化 */
  .loading-section {
    padding: var(--spacing-2xl) var(--spacing-md);
  }
  
  .error-state {
    padding: var(--spacing-xl) var(--spacing-md);
    min-height: 300px;
  }
  
  .error-title {
    font-size: var(--font-size-lg);
  }
  
  .error-description {
    font-size: var(--font-size-sm);
  }
}

/* 超小屏幕优化 */
@media screen and (max-width: 360px) {
  .search-section {
    padding: var(--spacing-sm);
  }
  
  .articles-section {
    padding: var(--spacing-sm);
  }
  
  .search-input {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 16px;
  }
  
  .article-card {
    border-radius: var(--radius-md);
  }
  
  .card-header,
  .card-content,
  .card-footer {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }
}

/* 横屏模式优化 */
@media screen and (max-height: 500px) and (orientation: landscape) {
  .search-section {
    padding: var(--spacing-md) var(--spacing-xl);
  }
  
  .search-container {
    margin-bottom: var(--spacing-sm);
  }
}

/* 可访问性样式 */
/* 焦点样式 */
*:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* 跳过链接 */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: var(--radius-sm);
  z-index: var(--z-tooltip);
  font-weight: var(--font-weight-medium);
}

.skip-link:focus {
  top: 6px;
}

/* 文章卡片键盘导航 */
.article-card:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.article-card:focus-within {
  outline: 1px solid var(--color-primary);
  outline-offset: 1px;
}

/* 搜索输入框焦点 */
.search-input:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

/* 按钮焦点样式 */
button:focus,
.btn-secondary:focus,
.btn-minimal:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

/* 链接焦点样式 */
a:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* 建议项焦点样式 */
.suggestion-item:focus,
.suggestion-item.active {
  background: var(--color-primary);
  color: white;
  outline: none;
}

/* 屏幕阅读器专用文本 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .article-card {
    border: 2px solid var(--color-text-primary);
  }
  
  .btn-secondary {
    border: 2px solid var(--color-text-primary);
  }
  
  .search-input {
    border: 2px solid var(--color-text-primary);
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  .article-card:hover {
    /* 在减少动画模式下保持简洁的hover效果 */
    box-shadow: var(--shadow-lg);
  }
  
  .skeleton {
    animation: none;
  }
  
  .loading-spinner {
    animation: none;
  }
}
</style> 
