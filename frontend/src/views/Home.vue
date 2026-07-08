<template>
  <div class="max-w-full mx-auto bg-background h-full" :style="{minHeight:fullShow?'calc(100vh - 100px)':'auto'}">
    <!-- 重新设计的文章网格 -->
    <section class="io-content-section">
      <main 
        class="articles-main"
        :class="{ 'is-flow-mode': props.fullShow }"
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
        <div v-else class="io-card-grid">
          <article 
            :class="['io-article-card', { 'has-photo': getFirstImage(article.content) }]"
            :style="getCardStyle(article)"
            v-for="article in paginatedArticles" 
            :key="article.id"
            role="article"
            :aria-labelledby="`article-title-${article.id}`"
          >
            <router-link
              :to="{ name: 'article', params: { id: article.id }}"
              @click="saveScrollState"
              class="io-card-cover"
              :aria-label="`阅读 ${article.title}`"
            >
              <span v-if="hasWeeklyLabel(article)" class="io-access">weekly</span>
              <span class="io-cover-dots" aria-hidden="true"></span>
              <span class="io-cover-cat">
                <span class="io-cover-square" aria-hidden="true"></span>
                {{ getArticleCategory(article) }}
              </span>
              <span class="io-cover-no mono">№ {{ getArticleNumber(article.id) }}</span>
              <span class="io-cover-code mono">{{ getArticleCode(article) }}</span>
            </router-link>
            
            <div class="io-card-body">
              <h3 :id="`article-title-${article.id}`">
                <router-link 
                  :to="{ name: 'article', params: { id: article.id }}"
                  @click="saveScrollState"
                >
                  {{ article.title }}
                </router-link>
              </h3>
              <p class="io-card-dek">{{ getArticleExcerpt(article.content) }}</p>
            </div>
            
            <div class="io-card-foot">
              <span class="io-foot-tags">
                <span v-for="tag in getArticleTags(article)" :key="tag" class="io-tag-chip">
                  {{ tag }}
                </span>
              </span>
              <router-link 
                :to="{ name: 'article', params: { id: article.id }}" 
                class="io-foot-right"
                @click="saveScrollState"
              >
                <span class="mono">{{ formatShortDate(article.created_at) }} · {{ getReadingMinutes(article.content) }} 分钟</span>
                <ArrowRight class="io-foot-arrow" aria-hidden="true" />
              </router-link>
            </div>
          </article>
        </div>

        <!-- 分页控制 -->
        <div class="io-pagination-wrap" v-if="totalPages > 1 && !fullShow && !isInitialLoading">
          <nav class="io-pagination" aria-label="文章分页">
            <button
              class="io-page-button"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              <i data-lucide="chevron-left" class="w-4 h-4"></i>
              上一页
            </button>
            
            <div class="io-page-indicator">
              <span>PAGE</span>
              <strong>{{ currentPage }}</strong>
              <span>/ {{ totalPages }}</span>
            </div>
            
            <button
              class="io-page-button"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
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

    <button
      v-show="showBackTop"
      class="io-back-top"
      type="button"
      aria-label="回到顶部"
      title="回到顶部"
      @click="scrollToTop"
    >
      <ArrowRight class="io-back-top-icon" aria-hidden="true" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import articles from '../data/articles.json'

type ArticleItem = {
  id: number
  title: string
  content: string
  created_at: string
  labels: string[]
  url: string
}

const props = defineProps<{
  fullShow: boolean
}>()

const fallbackSearchQuery = ref('')
const searchQuery = inject<Ref<string>>('iohubSearchQuery', fallbackSearchQuery)
const currentPage = ref(1)
const timeSeed = ref(null as NodeJS.Timeout | null)
const pageSize = 9

// 加载状态管理
const isLoading = ref(false)
const isInitialLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
const hasMoreData = ref(true)
const showBackTop = ref(false)

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

const checkWindowLoadMore = async () => {
  if (!props.fullShow) return
  
  if (timeSeed.value) {
    clearTimeout(timeSeed.value)
  }
  
  timeSeed.value = setTimeout(async () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight
    const threshold = 360

    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      await loadMoreArticles()
    }
  }, 300)
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const goToPage = (page: number) => {
  const nextPage = Math.min(Math.max(page, 1), totalPages.value)
  if (nextPage === currentPage.value) return
  currentPage.value = nextPage
  scrollToTop()
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

const categoryRules = [
  { name: 'AI 工具', code: 'TOOLS', tint: '#cc785c', keywords: ['AI', 'Agent', '智能', '模型', 'Cursor', 'Claude', 'GPT'] },
  { name: '开源项目', code: 'OPEN', tint: '#2f7d57', keywords: ['开源', 'GitHub', 'MIT', '源码', '自荐'] },
  { name: '产品发布', code: 'LAUNCH', tint: '#e8a55a', keywords: ['发布', '上线', '版本', '工具', 'App', '网站'] },
  { name: '工程实践', code: 'BUILD', tint: '#5db8a6', keywords: ['工程', '框架', '架构', '代码', '开发', '课程'] }
]

const getArticleCategoryMeta = (article: ArticleItem) => {
  const text = `${article.title} ${article.content} ${article.labels.join(' ')}`
  return categoryRules.find(rule => rule.keywords.some(keyword => text.includes(keyword))) || {
    name: '技术观察',
    code: 'INSIGHT',
    tint: '#5f6f52'
  }
}

const getArticleCategory = (article: ArticleItem) => getArticleCategoryMeta(article).name

const getArticleCode = (article: ArticleItem) => getArticleCategoryMeta(article).code

const getArticleNumber = (id: number) => String(id).slice(-3).padStart(3, '0')

const getArticleTags = (article: ArticleItem) => {
  const tags = new Set<string>()
  article.labels.slice(0, 2).forEach(label => tags.add(label))
  const text = `${article.title} ${article.content}`
  const candidates = ['AI', 'Agent', '开源', 'macOS', 'Vue', 'React', 'Python', 'Claude', 'GPT', '工具', '课程', 'PWA']
  candidates.forEach(tag => {
    if (tags.size < 2 && text.toLowerCase().includes(tag.toLowerCase())) {
      tags.add(tag)
    }
  })
  if (tags.size === 0) tags.add(getArticleCategory(article))
  return Array.from(tags).slice(0, 2)
}

const hasWeeklyLabel = (article: ArticleItem) => {
  return article.labels.some(label => label.toLowerCase() === 'weekly')
}

const getReadingMinutes = (content: string) => {
  const text = content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
  return Math.max(3, Math.ceil(text.length / 500))
}

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const cssUrl = (url: string) => `url("${url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`

const getCardStyle = (article: ArticleItem) => {
  const imageUrl = getFirstImage(article.content)
  const meta = getArticleCategoryMeta(article)
  const style: Record<string, string> = {
    '--tint': meta.tint
  }

  if (imageUrl) {
    style['--cover-img'] = cssUrl(imageUrl)
  }

  return style
}

// 保存滚动位置和当前页码
const saveScrollState = () => {
  const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
  
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
        
        if (props.fullShow && state.currentPage > 1) {
          console.log(`Need to load content up to page ${state.currentPage} for scroll position ${state.scrollPosition}`)
          
          const forceLoadContent = async () => {
            currentPage.value = state.currentPage
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
            const maxScrollTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
            const targetPosition = Math.min(state.scrollPosition, maxScrollTop)
            
            if (document.documentElement.scrollHeight >= targetPosition + window.innerHeight || targetPosition <= maxScrollTop) {
              window.scrollTo(0, targetPosition)
              
              if (Math.abs(window.pageYOffset - targetPosition) < 80) {
                console.log('Window scroll position restored successfully:', targetPosition)
                return
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

const handleWindowScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  showBackTop.value = scrollTop > 520
  throttledSaveScroll()
  void checkWindowLoadMore()
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
  window.removeEventListener('scroll', handleWindowScroll)
  
  if (saveScrollTimer) {
    clearTimeout(saveScrollTimer)
  }
  saveScrollState() // 保存最终状态
})
</script>
