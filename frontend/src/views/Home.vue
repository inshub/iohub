<template>
  <div class="max-w-full mx-auto bg-background h-full">
    <section class="io-content-section">
      <main class="articles-main">
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

        <div v-else-if="filteredArticles.length === 0" class="io-empty-state io-home-empty">
          <SearchX class="io-empty-icon" aria-hidden="true" />
          <h2>没有找到匹配内容</h2>
          <p>换一个关键词，或清空搜索查看全部精选内容。</p>
        </div>

        <!-- 文章列表 -->
        <div v-else class="io-card-grid">
          <article 
            :class="['io-article-card', { 'has-photo': getFirstImage(article.content) }]"
            :style="getCardStyle(article)"
            v-for="article in visibleArticles" 
            :key="article.id"
            role="article"
            :aria-labelledby="`article-title-${article.id}`"
          >
            <router-link
              :to="{ name: 'article', params: { id: article.id }}"
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
              >
                <span class="mono">{{ formatShortDate(article.created_at) }} · {{ getReadingMinutes(article.content) }} 分钟</span>
                <ArrowRight class="io-foot-arrow" aria-hidden="true" />
              </router-link>
            </div>
          </article>
        </div>

        <div v-if="!isInitialLoading && !hasError && visibleArticles.length > 0" class="io-feed-complete mono">
          已展示全部 {{ visibleArticles.length }} 篇内容
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
import { computed, inject, ref, onMounted, onBeforeUnmount, nextTick, type Ref } from 'vue'
import { ArrowRight, SearchX } from 'lucide-vue-next'
import articles from '../data/articles.json'

type ArticleItem = {
  id: number
  title: string
  content: string | null
  created_at: string
  labels: string[]
  url: string
}

const fallbackSearchQuery = ref('')
const searchQuery = inject<Ref<string>>('iohubSearchQuery', fallbackSearchQuery)

// 加载状态管理
const isInitialLoading = ref(true)
const hasError = ref(false)
const errorMessage = ref('')
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

// 初始化数据加载
const initializeData = async () => {
  isInitialLoading.value = true
  try {
    await nextTick()
  } catch (error) {
    hasError.value = true
    errorMessage.value = '数据加载失败'
  } finally {
    isInitialLoading.value = false
  }
}

const visibleArticles = computed(() => filteredArticles.value)

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 重试加载函数
const retryLoad = () => {
  hasError.value = false
  void initializeData()
}

// 预加载关键图片
const preloadCriticalImages = () => {
  // 预加载前6张图片
  visibleArticles.value.slice(0, 6).forEach(article => {
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

const getFirstImage = (content: string | null) => {
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

const getArticleExcerpt = (content: string | null) => {
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

const getReadingMinutes = (content: string | null) => {
  const text = (content || '')
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

const handleWindowScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  showBackTop.value = scrollTop > 520
}

// 组件挂载时设置事件监听和恢复状态
onMounted(async () => {
  await nextTick()
  
  window.addEventListener('scroll', handleWindowScroll, { passive: true })
  
  // 先初始化数据加载
  await initializeData()
  
  // 预加载关键图片
  await nextTick()
  preloadCriticalImages()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleWindowScroll)
})
</script>
