<template>
  <div class="container">
    <div class="article-detail" v-if="article">
      <!-- 返回按钮 -->
      <div class="back-button">
        <router-link to="/" class="back-link icon-btn-text">
          <i class="iconfont icon-arrow-left"></i>
          返回首页
        </router-link>
      </div>
      
      <header>
        <h1>{{ article.title }}</h1>
        <div class="meta">
          <span class="date">{{ formatDate(article.created_at) }}</span>
          <div class="labels">
            <span v-for="label in article.labels" :key="label" class="label">
              <i class="iconfont icon-tag"></i>
              {{ label }}
            </span>
          </div>
        </div>
      </header>
      <main>
        <div class="markdown-body" v-html="markdownToHtml(article.content)"></div>
        <div class="source">
          <a :href="article.url" target="_blank" class="icon-btn-text">
            <i class="iconfont icon-external-link"></i>
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
          <i class="iconfont icon-file icon-xl"></i>
        </div>
        <h2>
          <i class="iconfont icon-search"></i>
          文章未找到
        </h2>
        <p>抱歉，您访问的文章不存在或已被移除。</p>
        <router-link to="/" class="back-home-btn icon-btn-text">
          <i class="iconfont icon-home"></i>
          返回首页
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { marked } from 'marked'
import articles from '../data/articles.json'

const props = defineProps<{
  id: string
}>()

const article = computed(() => 
  articles.find(a => a.id === parseInt(props.id))
)

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
  padding: 32px 24px;
  min-height: calc(100vh - 64px);
  background: #ffffff;
}

.back-button {
  margin-bottom: 24px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #3b82f6;
  text-decoration: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  transition: all 0.2s ease;
}

.back-link:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #2563eb;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
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
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
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
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #0f766e;
  background: #f0fdfa;
  transition: all 0.2s ease;
  cursor: default;
  display: inline-flex;
  align-items: center;
  line-height: 1.2;
  border: 1px solid #99f6e4;
}

.label:hover {
  background: #ccfbf1;
  border-color: #5eead4;
}

main {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.markdown-body {
  color: #475569;
  line-height: 1.7;
  font-size: 1.0625rem;
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
  color: #1e293b;
  font-weight: 600;
  margin: 2em 0 1em;
  line-height: 1.25;
}

.markdown-body h1 { font-size: 1.75rem; }
.markdown-body h2 { font-size: 1.5rem; }
.markdown-body h3 { font-size: 1.25rem; }
.markdown-body h4 { font-size: 1.125rem; }

.markdown-body pre {
  background: #f1f5f9;
  padding: 20px;
  border-radius: 12px;
  overflow-x: auto;
  margin: 1.5em 0;
  border: 1px solid #e2e8f0;
  font-size: 0.9375rem;
}

.markdown-body code {
  font-family: var(--font-family-mono);
  color: #475569;
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875em;
}

.markdown-body blockquote {
  margin: 1.5em 0;
  padding: 1em 1.5em;
  border-left: 4px solid #3b82f6;
  background: #f8fafc;
  color: #475569;
  border-radius: 0 8px 8px 0;
}

.source {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.source a {
  font-size: 0.9375rem;
  color: #3b82f6;
  font-weight: 600;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.source a:hover {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
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

.back-home-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  background: #3b82f6;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.back-home-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}
</style> 