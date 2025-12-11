<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="article-detail" v-if="article">
      <!-- 返回按钮 -->
      <div class="mb-8">
        <button @click="goBack" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
          <i data-lucide="arrow-left" class="w-4 h-4 mr-2"></i>
          返回首页
        </button>
      </div>
      
      <header class="mb-8">
        <h1 class="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">{{ article.title }}</h1>
        <div class="flex items-center text-sm text-muted-foreground">
          <span>{{ formatDate(article.created_at) }}</span>
          <div v-if="article.labels.length" class="ml-4 flex gap-2">
            <span v-for="label in article.labels" :key="label" class="px-2 py-1 bg-secondary/10 text-secondary rounded-md text-xs font-semibold">
              {{ label }}
            </span>
          </div>
        </div>
      </header>
      <main class="bg-card text-card-foreground border rounded-lg overflow-hidden">
        <div class="prose dark:prose-invert max-w-none p-6" v-html="markdownToHtml(article.content)"></div>
        <div class="p-6 border-t border-border flex justify-end">
          <a :href="article.url" target="_blank" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            查看原文
            <i data-lucide="external-link" class="w-4 h-4 ml-2"></i>
          </a>
        </div>
      </main>
      <div class="fixed inset-0 bg-background/90 flex justify-center items-center z-[1000] cursor-zoom-out backdrop-blur-sm" v-if="previewImage" @click="closePreview">
        <img :src="previewImage" alt="🖼️ 预览图片" class="max-w-[90%] max-h-[90vh] object-contain rounded-lg shadow-2xl md:max-w-[95%] md:max-h-[95vh]">
      </div>
    </div>
    
    <!-- 文章不存在时的提示 -->
    <div v-else class="text-center py-20">
        <i data-lucide="file-question" class="w-16 h-16 mx-auto text-muted-foreground mb-4"></i>
        <h2 class="text-2xl font-bold mb-2">文章未找到</h2>
        <p class="text-muted-foreground mb-6">抱歉，您访问的文章不存在或已被移除。</p>
        <router-link to="/" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
          <i data-lucide="home" class="w-4 h-4 mr-2"></i>
          返回首页
        </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { marked } from 'marked'
import { useRouter } from 'vue-router'
import articles from '../data/articles.json'

const props = defineProps<{
  id: string
}>()

const router = useRouter()

const article = computed(() => 
  articles.find(a => a.id === parseInt(props.id))
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

const previewImage = ref<string | null>(null)

const handleImageClick = (event: MouseEvent) => {
  const target = event.target as HTMLImageElement
  if (target.tagName === 'IMG') {
    previewImage.value = target.src
    document.body.style.overflow = 'hidden'
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
  
  const html = marked(content)
  return html.replace(
    /<img\s+src="([^"]+)"/g, 
    '<div class="article-img-wrapper"><div class="img-container"><img src="$1" loading="lazy" onclick="window.handleImageClick(event)"'
  )
}

window.handleImageClick = handleImageClick
</script>

 