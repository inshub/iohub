<template>
  <div class="home-container" :style="{minHeight:fullShow?'calc(100vh - 100px)':'auto'}">
    <!-- 震撼的Hero区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">🚀</span>
          <span class="badge-text">GitHub Weekly</span>
        </div>
        <h1 class="hero-title">
          发现最前沿的
          <span class="title-highlight">开源项目</span>
        </h1>
        <p class="hero-description">
          精选全球优质开源项目，追踪技术发展趋势，助力开发者成长
        </p>
        <div class="hero-search">
          <div class="search-container">
            <div class="search-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
            </div>
            <input 
              v-model="searchQuery" 
              placeholder="搜索感兴趣的技术、框架、工具..."
              class="search-input"
            >
            <div class="search-shortcut">⌘K</div>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat-item">
            <div class="stat-number">{{ filteredArticles.length }}</div>
            <div class="stat-label">精选项目</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">持续更新</div>
            <div class="stat-label">每周发布</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-number">开源免费</div>
            <div class="stat-label">完全公开</div>
          </div>
        </div>
      </div>
      <div class="hero-visual">
        <div class="floating-cards">
          <div class="floating-card" v-for="(article, index) in featuredArticles" :key="index">
            <div class="card-icon">⭐</div>
            <div class="card-title">{{ article.title.slice(0, 20) }}...</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 重新设计的文章网格 -->
    <section class="articles-section">
      <div class="section-header">
        <h2 class="section-title">最新精选</h2>
      </div>

      <main 
        class="articles-main"
        :class="{ 'hide-scrollbar': props.fullShow }"
        :style="{
          overflowY: props.fullShow ? 'auto' : 'hidden',
          height: props.fullShow ? 'calc(100vh - 180px)' : 'auto'
        }" 
        v-on:scrollend="scorllEnd"
      >
        <div class="articles-grid">
          <article class="article-card" v-for="article in paginatedArticles" :key="article.id">
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
              <img :src="getFirstImage(article.content)" :alt="article.title">
              <div class="image-overlay"></div>
            </div>
            
            <!-- 文章内容 -->
            <div class="card-content">
              <h3 class="card-title">
                <router-link :to="{ name: 'article', params: { id: article.id }}">
                  {{ article.title }}
                </router-link>
              </h3>
              <p class="card-excerpt">{{ getArticleExcerpt(article.content) }}</p>
            </div>
            
            <!-- 文章底部 -->
            <div class="card-footer">
              <router-link 
                :to="{ name: 'article', params: { id: article.id }}" 
                class="btn-minimal"
              >
                阅读全文
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"></path>
                </svg>
              </router-link>
            </div>
          </article>
        </div>

        <!-- 分页控制 -->
        <div class="pagination-wrapper" v-if="totalPages > 1 && !fullShow">
          <div class="pagination">
            <button 
              class="page-btn btn-secondary" 
              :disabled="currentPage === 1"
              @click="currentPage--"
            >
              ← 上一页
            </button>
            
            <div class="page-info">
              <span class="current-page">{{ currentPage }}</span>
              <span class="page-separator">/</span>
              <span class="total-pages">{{ totalPages }}</span>
            </div>
            
            <button 
              class="page-btn btn-secondary" 
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            >
              下一页 →
            </button>
          </div>
        </div>
        
        <!-- 加载状态 -->
        <div v-if="fullShow" class="loading-section">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <span class="loading-text">发现更多精彩内容...</span>
          </div>
        </div>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import articles from '../data/articles.json'

const props = defineProps<{
  fullShow: boolean
}>()

const emit = defineEmits(['update:fullShow'])

const searchQuery = ref('')
const currentPage = ref(1)
const timeSeed = ref(null as NodeJS.Timeout | null)
const pageSize = 6 // 每页显示的文章数量

const filteredArticles = computed(() => {
  if (!searchQuery.value) return articles
  
  const query = searchQuery.value.toLowerCase()
  return articles.filter(article => {
    const title = article.title || ''
    const content = article.content || ''
    return title.toLowerCase().includes(query) || content.toLowerCase().includes(query)
  })
})

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
  if(!props.fullShow) {
    return
  }
  if(timeSeed.value) {
    clearTimeout(timeSeed.value)
  }
  timeSeed.value = setTimeout(() => {
    currentPage.value = currentPage.value === totalPages.value ? currentPage.value : currentPage.value + 1
  }, 500);
}

watch(searchQuery, () => {
  currentPage.value = 1
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
  if (props.fullShow && mainContainer.value) {
    const scrollTop = mainContainer.value.scrollTop
    const state = {
      scrollPosition: scrollTop,
      currentPage: currentPage.value,
      searchQuery: searchQuery.value,
      timestamp: Date.now()
    }
    sessionStorage.setItem('iohub-scroll-state', JSON.stringify(state))
  }
}

// 恢复滚动位置和当前页码
const restoreScrollState = async () => {
  const savedState = sessionStorage.getItem('iohub-scroll-state')
  if (savedState && props.fullShow) {
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
        
        // 等待DOM更新后恢复滚动位置
        await nextTick()
        if (mainContainer.value && state.scrollPosition) {
          setTimeout(() => {
            if (mainContainer.value) {
              mainContainer.value.scrollTop = state.scrollPosition
            }
          }, 100)
        }
      }
    } catch (error) {
      console.warn('Failed to restore scroll state:', error)
    }
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
  mainContainer.value = document.querySelector('main') as HTMLElement
  
  if (mainContainer.value) {
    mainContainer.value.addEventListener('scroll', handleScroll, { passive: true })
    await restoreScrollState()
  }
})

// 组件卸载时清理事件监听
onBeforeUnmount(() => {
  if (mainContainer.value) {
    mainContainer.value.removeEventListener('scroll', handleScroll)
  }
  if (saveScrollTimer) {
    clearTimeout(saveScrollTimer)
  }
  saveScrollState() // 保存最终状态
})
</script>

<style scoped>
/* Hero区域 - 震撼第一印象 */
.home-container {
  max-width: 100%;
  margin: 0 auto;
  background: var(--color-bg-page);
  min-height: calc(100vh - 64px);
}

.hero-section {
  position: relative;
  padding: var(--spacing-5xl) var(--spacing-xl);
  background: var(--color-bg-page);
  overflow: hidden;
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(0, 102, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0, 255, 136, 0.08) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(255, 107, 53, 0.06) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  text-align: center;
  max-width: 800px;
  z-index: 2;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--gradient-glass);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  margin-bottom: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  animation: float 3s ease-in-out infinite;
}

.badge-icon {
  font-size: var(--font-size-lg);
}

.badge-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.hero-title {
  font-size: var(--font-size-5xl);
  font-weight: var(--font-weight-extrabold);
  line-height: 1.1;
  margin-bottom: var(--spacing-xl);
  color: var(--color-text-primary);
}

.title-highlight {
  background: var(--gradient-primary);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% 200%;
  animation: gradientShift 3s ease-in-out infinite;
}

.hero-description {
  font-size: var(--font-size-xl);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-3xl);
  line-height: 1.6;
}

/* 搜索区域 */
.hero-search {
  margin-bottom: var(--spacing-3xl);
}

.search-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-sm);
  box-shadow: var(--shadow-xl);
  transition: all var(--transition-base);
}

.search-container:focus-within {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: var(--color-text-secondary);
  border-radius: var(--radius-lg);
  background: var(--color-bg-secondary);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
  font-family: var(--font-family-primary);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-shortcut {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
  font-family: var(--font-family-secondary);
}

/* 统计数据 */
.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xl);
  margin-top: var(--spacing-2xl);
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  font-weight: var(--font-weight-medium);
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--color-border);
}

/* 视觉装饰 */
.hero-visual {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1;
}

.floating-cards {
  position: relative;
  width: 100%;
  height: 100%;
}

.floating-card {
  position: absolute;
  background: var(--color-bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  min-width: 200px;
  box-shadow: var(--shadow-lg);
  animation: floatMove 6s ease-in-out infinite;
}

.floating-card:nth-child(1) {
  top: 10%;
  left: 5%;
  animation-delay: 0s;
}

.floating-card:nth-child(2) {
  top: 20%;
  right: 10%;
  animation-delay: 1s;
}

.floating-card:nth-child(3) {
  bottom: 30%;
  left: 8%;
  animation-delay: 2s;
}

.floating-card:nth-child(4) {
  bottom: 20%;
  right: 5%;
  animation-delay: 3s;
}

.card-icon {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-sm);
}

.card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

/* 文章区域 */
.articles-section {
  padding: var(--spacing-4xl) var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-3xl);
  text-align: center;
}

.section-title {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin: 0;
}


/* 文章网格 */
.articles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: var(--spacing-3xl);
  padding: var(--spacing-xl) 0;
}

.article-card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
  position: relative;
  height: fit-content;
}

.article-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-2xl);
  border-color: var(--color-primary);
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
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-lg);
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
@media screen and (max-width: 1200px) {
  .articles-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--spacing-2xl);
  }
}

@media screen and (max-width: 768px) {
  .hero-section {
    padding: var(--spacing-3xl) var(--spacing-lg);
    min-height: 60vh;
  }
  
  .hero-title {
    font-size: var(--font-size-3xl);
  }
  
  .hero-description {
    font-size: var(--font-size-lg);
  }
  
  .hero-stats {
    flex-direction: column;
    gap: var(--spacing-lg);
  }
  
  .stat-divider {
    width: 40px;
    height: 1px;
  }
  
  .articles-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
  }
  
  .section-header {
    flex-direction: column;
    gap: var(--spacing-lg);
    text-align: center;
  }
  
  .floating-card {
    display: none;
  }
  
  .search-container {
    margin: 0 var(--spacing-lg);
  }
}

@media screen and (max-width: 480px) {
  .hero-section {
    padding: var(--spacing-2xl) var(--spacing-md);
  }
  
  .articles-section {
    padding: var(--spacing-2xl) var(--spacing-md);
  }
  
  .article-card {
    border-radius: var(--radius-lg);
  }
  
  .pagination {
    padding: var(--spacing-lg);
    gap: var(--spacing-lg);
  }
}
</style> 
