<template>
  <div class="container" :style="{minHeight:fullShow?'calc(100vh - 100px)':'auto'}">
    <!-- 整合的主内容卡片 -->
    <div class="main-card">
      <header>
        <div class="search">
          <div class="search-input-wrapper">
            <input v-model="searchQuery" placeholder="搜索文章...">
          </div>
        </div>
      </header>

      <main 
        :class="{ 'hide-scrollbar': props.fullShow }"
        :style="{
          overflowY: props.fullShow ? 'auto' : 'hidden',
          height: props.fullShow ? 'calc(100vh - 180px)' : 'auto'
        }" 
        v-on:scrollend="scorllEnd"
      >
        <div class="articles">
          <article v-for="article in paginatedArticles" :key="article.id">
            <h2>
              <router-link :to="{ name: 'article', params: { id: article.id }}">
                {{ article.title }}
              </router-link>
            </h2>
            <div class="preview-image" v-if="getFirstImage(article.content)">
              <img :src="getFirstImage(article.content)" :alt="article.title">
            </div>
            <div class="labels">
              <span v-for="label in article.labels" :key="label" class="label">
                {{ label }}
              </span>
            </div>
            <div class="content">
              <p>{{ getArticleExcerpt(article.content) }}</p>
              <div class="content-fade"></div>
            </div>
            <div class="article-footer">
              <span class="date">
                {{ formatDate(article.created_at) }}
              </span>
              <router-link :to="{ name: 'article', params: { id: article.id }}" class="read-more-link btn-text btn-sm">
                阅读更多
              </router-link>
            </div>
          </article>
        </div>

        <div class="pagination" v-if="totalPages > 1 && !fullShow">
        <button 
          class="page-btn btn-secondary btn-sm" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          上一页
        </button>
        
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        
        <button 
          class="page-btn btn-secondary btn-sm" 
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          下一页
        </button>
      </div>
      <div v-if="fullShow" class="loading">
        <div class="loading-spinner"></div>
        <span class="loading-text">
          加载更多内容中...
        </span>
      </div>
    </main>
    </div>
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

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: transparent;
}

/* 主内容卡片 - 整合搜索和内容 */
.main-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}

header {
  padding: 24px 24px 0;
  background: transparent;
  border: none;
  box-shadow: none;
  margin-bottom: 0;
  border-bottom: 1px solid var(--color-border);
}

.search {
  max-width: 600px;
  margin: 0 auto 24px;
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search input {
  display: inline-block;
  padding: 12px 16px;
  font-size: var(--font-size-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  transition: all var(--transition-base);
  color: var(--color-text-primary);
  width: 100%;
  box-shadow: var(--shadow-sm);
}

.search input {
  width: 80%;
}

.search input[type="checkbox"] {
  width: 5%;
}

.search input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1), var(--shadow-md);
}

.search input::placeholder {
  color: var(--color-text-tertiary);
}

/* 主内容区域 */
main {
  padding: 24px;
  background: transparent;
}

.articles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  padding: 12px 0;
}

article {
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-bg-primary);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
}

article:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

article h2 {
  font-size: 1.375rem;
  font-weight: 600;
  margin-bottom: 16px;
  line-height: 1.3;
  color: #1e293b;
}

article h2 a {
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}

article h2 a:hover {
  color: var(--color-primary);
}

.labels {
  margin: 12px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.label {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-secondary);
  background: var(--color-secondary-light);
  transition: all var(--transition-base);
  cursor: default;
  display: inline-flex;
  align-items: center;
  line-height: 1.2;
  border: 1px solid var(--color-secondary);
}

.label:hover {
  background: var(--color-secondary);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.content {
  position: relative;
  margin: 12px 0;
  min-height: 40px;
}

.content p {
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: #475569;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.date {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.article-footer .read-more-link {
  font-size: 0.875rem;
  color: white;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.preview-image {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  margin-bottom: 16px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.preview-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.preview-image:hover img {
  transform: scale(1.02);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 48px;
  padding: 24px 0;
}


.page-info {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
  padding: 0 16px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 20px auto;
  padding: 20px;
}

.loading-spinner {
  border: 4px solid #f3f3f3; 
  border-top: 4px solid #3498db; 
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 2s linear infinite;
}

.loading-text {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media screen and (max-width: 768px) {
  .container {
    padding: 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .articles {
    display: grid;
    grid-template-columns: 1fr;  /* 强制单列 */
    gap: 16px;
    padding: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  article {
    width: 100%;
    margin: 0;
    box-sizing: border-box;
  }

  .preview-image {
    width: 100%;
    padding-bottom: 52.25%;
  }

  .search {
    width: 100%;
    padding: 0 8px;
    box-sizing: border-box;
  }

  .search input {
    width: 100%;
    box-sizing: border-box;
  }

  article h2 {
    font-size: 1.125rem;  /* 调小标题字体 */
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .preview-image {
    margin-bottom: 8px;  /* 减小图片下方间距 */
  }

  .content p {
    font-size: 0.875rem;
    line-height: 1.5;
    -webkit-line-clamp: 2;  /* 移动端显示2行 */
  }
}

@media screen and (max-width: 400px) {
  .container {
    padding: 12px 8px;
    width: 100%;
    box-sizing: border-box;
  }

  .articles {
    padding: 4px;
    gap: 12px;
    width: 100%;
    box-sizing: border-box;
  }

  article {
    padding: 12px;
    width: 100%;
    min-width: 300px;
    max-width: 100%;
    box-sizing: border-box;
  }

  .article-footer {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .content p {
    font-size: 0.875rem;
    -webkit-line-clamp: 3;
  }

  .pagination {
    padding: 16px 8px;
  }

  article h2 {
    font-size: 1rem;  /* 更小屏幕进一步缩小标题 */
  }

  article {
    padding: 12px;  /* 减小卡片内边距 */
  }

  .labels {
    margin: 8px 0;
  }

  .label {
    padding: 2px 8px;  /* 减小标签内边距 */
    font-size: 11px;   /* 稍微调小标签字体 */
  }
}

.hide-scrollbar {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.hide-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

</style> 
