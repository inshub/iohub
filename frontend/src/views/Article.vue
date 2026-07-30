<template>
  <div class="io-article-page">
    <div class="io-article-detail" v-if="article">
      <div class="io-article-backbar">
        <button @click="goBack" class="io-soft-button">
          <ArrowLeft class="io-button-icon" aria-hidden="true" />
          返回首页
        </button>
      </div>
      
      <article class="io-article-frame" :style="articleFrameStyle">
        <div class="io-article-main">
          <header class="io-article-hero">
            <div class="io-article-head">
              <div class="io-article-kicker mono">
                № {{ articleNumber }} · {{ articleCategory.code }} · {{ readingMinutes }} 分钟阅读
              </div>
              <h1>{{ article.title }}</h1>
              <p v-if="articleExcerpt">{{ articleExcerpt }}</p>
              <div class="io-article-meta-row">
                <div class="io-article-meta">
                  <span>{{ formatDate(article.created_at) }}</span>
                  <span v-for="label in articleTags" :key="label" class="io-tag-chip">
                    {{ label }}
                  </span>
                </div>
                <a :href="article.url" target="_blank" rel="noopener noreferrer" class="io-source-link">
                  查看原文
                  <ExternalLink class="io-button-icon" aria-hidden="true" />
                </a>
              </div>
            </div>
          </header>

          <main class="io-prose-card">
            <div class="io-markdown" v-html="markdownToHtml(article.content)"></div>
          </main>
        </div>
      </article>

      <div class="io-lightbox" v-if="previewImage" @click="closePreview">
        <img :src="previewImage" alt="预览图片">
      </div>
    </div>
    
    <!-- 文章不存在时的提示 -->
    <div v-else class="io-empty-state">
        <FileQuestion class="io-empty-icon" aria-hidden="true" />
        <h2>文章未找到</h2>
        <p>抱歉，您访问的文章不存在或已被移除。</p>
        <router-link to="/" class="io-primary-button">
          <Home class="io-button-icon" aria-hidden="true" />
          返回首页
        </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { marked } from 'marked'
import { useRouter } from 'vue-router'
import { ArrowLeft, ExternalLink, FileQuestion, Home } from 'lucide-vue-next'
import articles from '../data/articles.json'

type ArticleItem = {
  id: number
  title: string
  content: string
  created_at: string
  labels: string[]
  url: string
}

declare global {
  interface Window {
    handleImageClick: (event: MouseEvent) => void
  }
}

const props = defineProps<{
  id: string
}>()

const router = useRouter()

const article = computed<ArticleItem | undefined>(() => 
  articles.find(a => a.id === parseInt(props.id, 10))
)

const goBack = () => {
  // 直接跳转到首页，确保触发 Home.vue 的 restoreScrollState()
  router.push('/')
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const categoryRules = [
  { name: 'AI 工具', code: 'TOOLS', tint: '#cc785c', keywords: ['AI', 'Agent', '智能', '模型', 'Cursor', 'Claude', 'GPT'] },
  { name: '开源项目', code: 'OPEN', tint: '#2f7d57', keywords: ['开源', 'GitHub', 'MIT', '源码', '自荐'] },
  { name: '产品发布', code: 'LAUNCH', tint: '#e8a55a', keywords: ['发布', '上线', '版本', '工具', 'App', '网站'] },
  { name: '工程实践', code: 'BUILD', tint: '#5db8a6', keywords: ['工程', '框架', '架构', '代码', '开发', '课程'] }
]

const getArticleCategoryMeta = (item: ArticleItem) => {
  const text = `${item.title} ${item.content} ${item.labels.join(' ')}`
  return categoryRules.find(rule => rule.keywords.some(keyword => text.includes(keyword))) || {
    name: '技术观察',
    code: 'INSIGHT',
    tint: '#5f6f52'
  }
}

const articleCategory = computed(() => article.value ? getArticleCategoryMeta(article.value) : {
  name: '技术观察',
  code: 'INSIGHT',
  tint: '#5f6f52'
})

const articleFrameStyle = computed(() => {
  const style: Record<string, string> = {
    '--tint': articleCategory.value.tint
  }

  return style
})

const articleNumber = computed(() => article.value ? String(article.value.id).slice(-3).padStart(3, '0') : '000')

const readingMinutes = computed(() => {
  if (!article.value) return 3
  const text = article.value.content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')
  return Math.max(3, Math.ceil(text.length / 500))
})

const articleTags = computed(() => {
  if (!article.value) return []
  const tags = new Set<string>()
  article.value.labels.slice(0, 3).forEach(label => tags.add(label))
  const text = `${article.value.title} ${article.value.content}`
  const candidates = ['AI', 'Agent', '开源', 'macOS', 'Vue', 'React', 'Python', 'Claude', 'GPT', '工具', '课程', 'PWA']
  candidates.forEach(tag => {
    if (tags.size < 3 && text.toLowerCase().includes(tag.toLowerCase())) {
      tags.add(tag)
    }
  })
  if (tags.size === 0) tags.add(articleCategory.value.name)
  return Array.from(tags).slice(0, 3)
})

const articleExcerpt = computed(() => {
  if (!article.value) return ''
  const textContent = article.value.content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    .replace(/#+ /g, '')
    .replace(/\*\*/g, '')
    .trim()

  const paragraph = textContent
    .split('\n')
    .map(item => item.trim())
    .find(item => item.length > 30 && !item.includes('---')) || ''

  return paragraph.length > 120 ? `${paragraph.slice(0, 120)}...` : paragraph
})

const previewImage = ref<string | null>(null)

const openPreview = (src: string) => {
  previewImage.value = src
  document.body.style.overflow = 'hidden'
}

const handleImageClick = (event: MouseEvent) => {
  const target = event.target as HTMLImageElement
  if (target.tagName === 'IMG') {
    openPreview(target.src)
  }
}

const closePreview = () => {
  previewImage.value = null
  document.body.style.overflow = ''
}

const markdownToHtml = (content: string) => {
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false,
    sanitize: false,
  })
  
  const html = marked(content) as string
  return html.replace(
    /<img\s+/g,
    '<img class="io-markdown-image" loading="lazy" onclick="window.handleImageClick(event)" '
  )
}

window.handleImageClick = handleImageClick
</script>

 
