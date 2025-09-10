<template>
  <div class="container">
    <div class="article-detail" v-if="article">
      <!-- 返回按钮 -->
      <div class="back-button">
        <button @click="goBack" class="btn-link">
          ← 返回首页
        </button>
      </div>
      
      <header>
        <h1>{{ article.title }}</h1>
        <div class="meta">
          <span class="date">{{ formatDate(article.created_at) }}</span>
          <div class="labels">
            <span v-for="label in article.labels" :key="label" class="label">
              {{ label }}
            </span>
          </div>
        </div>
      </header>
      <main>
        <div class="markdown-body" v-html="markdownToHtml(article.content)"></div>
        <div class="source">
          <a :href="article.url" target="_blank" class="btn-source">
            查看原文
          </a>
        </div>
      </main>
      <div class="image-preview" v-if="previewImage" @click="closePreview">
        <img :src="previewImage" alt="🖼️ 预览图片">
      </div>
    </div>
    
    <!-- 文章不存在时的提示 -->
    <div v-else class="not-found">
      <div class="not-found-content">
        <div class="not-found-icon">
          📄
        </div>
        <h2>
          文章未找到
        </h2>
        <p>抱歉，您访问的文章不存在或已被移除。</p>
        <router-link to="/" class="btn-link">
          🏠 返回首页
        </router-link>
      </div>
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

<style scoped>
.container {
  max-width: 60%;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 64px);
  background: transparent;
}

.back-button {
  margin-bottom: 24px;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 24px;
  line-height: 1.2;
  letter-spacing: -0.025em;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0;
  padding: 20px;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.date {
  color: #64748b;
  font-size: 0.9375rem;
  font-weight: 500;
}

.labels {
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

main {
  background: var(--color-bg-primary);
  padding: 32px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
}

.markdown-body {
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: none;
  margin: 0;
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
}

.markdown-body >>> img {
  width: 100%;
}

.markdown-body p {
  margin: 1.2em 0;
  line-height: 1.7;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  color: var(--color-text-primary);
  font-weight: 600;
  margin: 2.5em 0 1.5em;
  line-height: 1.25;
  position: relative;
}

.markdown-body h1::before,
.markdown-body h2::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--color-secondary);
  border-radius: 2px;
}

.markdown-body h1 { font-size: 1.875rem; }
.markdown-body h2 { font-size: 1.625rem; }
.markdown-body h3 { font-size: 1.375rem; }
.markdown-body h4 { font-size: 1.125rem; }

.markdown-body pre {
  background: var(--color-bg-secondary);
  padding: 16px;
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: 1.5em 0;
  border: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
  box-shadow: var(--shadow-sm);
}

.markdown-body code {
  font-family: var(--font-family-mono);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-size: 0.875em;
  font-weight: 500;
}

.markdown-body blockquote {
  margin: 1.5em 0;
  padding: 1em 1.5em;
  border-left: 4px solid var(--color-secondary);
  background: var(--color-secondary-light);
  color: var(--color-text-secondary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  position: relative;
}

.markdown-body blockquote::before {
  content: '"';
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 1.5rem;
  color: var(--color-secondary);
  opacity: 0.5;
}

.source {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}


.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: zoom-out;
  backdrop-filter: blur(4px);
}

.image-preview img {
  max-width: 90%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

@media screen and (max-width: 768px) {
  .container {
    max-width: 100%;
    padding: 16px;
  }

  h1 {
    font-size: 1.25rem;
    margin-bottom: 12px;
  }

  .markdown-body h1 { font-size: 1.25rem; }
  .markdown-body h2 { font-size: 1.125rem; }
  .markdown-body h3 { font-size: 1rem; }
  .markdown-body h4 { font-size: 0.938rem; }
}

@media screen and (max-width: 480px) {
  .container {
    padding: 12px 8px;
  }

  h1 {
    font-size: 1.125rem;
  }

  main {
    padding: 12px;
  }

  .markdown-body {
    font-size: 0.875rem;
  }

  .image-preview img {
    max-width: 95%;
    max-height: 95vh;
  }

  .labels {
    margin: 8px 0;
  }

  .source {
    margin-top: 16px;
    padding-top: 12px;
  }
}

/* 404 页面样式 */
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 20px;
}

.not-found-content {
  text-align: center;
  max-width: 400px;
}

.not-found-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.not-found h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 1rem;
}

.not-found p {
  color: #64748b;
  margin-bottom: 2rem;
  line-height: 1.6;
}

</style> 