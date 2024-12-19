<template>
  <div class="container" :style="{minHeight:fullShow?'calc(100vh - 100px)':'auto'}">
    <header>
      <div class="search">
        <input v-model="searchQuery" placeholder="搜索文章...">
        <input type="checkbox" v-model="fullShow" id="fullShow">
      </div>
    </header>

    <main :style="{overflowY:fullShow?'auto':'hidden',height: fullShow?'calc(100vh - 180px)':'auto'}" v-on:scrollend="scorllEnd">
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
            <span class="date">{{ formatDate(article.created_at) }}</span>
            <a :href="article.url" target="_blank">阅读更多</a>
          </div>
        </article>
      </div>

      <div class="pagination" v-if="totalPages > 1 && !fullShow">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          上一页
        </button>
        
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        
        <button 
          class="page-btn" 
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          下一页
        </button>
      </div>
      <div v-if="fullShow" class="loading"></div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { marked } from 'marked'
import articles from '../data/articles.json'

const searchQuery = ref('')
const currentPage = ref(1)
const fullShow = ref(true)
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
  if(fullShow.value) {
    end = pageSize + (currentPage.value - 1) * pageSize
  } else {
    start = (currentPage.value - 1) * pageSize
    end = start + pageSize
  }
  
  return filteredArticles.value.slice(start, end)
})

const scorllEnd = () => {
  if(!fullShow) {
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
</script>

<style scoped>

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  min-height: calc(100vh - 64px);
}

header {
  margin-bottom: 24px;
  text-align: center;
}

.search {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
}

.search input {
  display: inline-block;
  padding: 12px 20px;
  font-size: 0.875rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  transition: all 0.2s ease;
  color: #374151;
}

.search input {
  width: 80%;
}

.search input[type="checkbox"] {
  width: 5%;
}

.search input:focus {
  border-color: #2563eb;
  outline: none;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search input::placeholder {
  color: #9ca3af;
}

.articles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  padding: 12px;
}

article {
  padding: 20px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
}

article:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

article h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  line-height: 1.4;
  color: #111827;
}

article h2 a {
  color: inherit;
  text-decoration: none;
}

.labels {
  margin: 12px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.label {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  color: #16a34a;
  background: #dcfce7;
  transition: all 0.2s ease;
  cursor: default;
  display: inline-flex;
  align-items: center;
  line-height: 1.2;
}

.label:hover {
  background: #bbf7d0;
}

.content {
  position: relative;
  margin: 12px 0;
  min-height: 40px;
}

.content p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #4b5563;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.date {
  color: #6b7280;
  font-size: 0.875rem;
}

.article-footer a {
  font-size: 0.875rem;
  color: #2563eb;
  font-weight: 500;
  text-decoration: none;
}

.article-footer a:hover {
  text-decoration: underline;
}

.preview-image {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
}

.preview-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.preview-image:hover img {
  transform: scale(1.05);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 48px;
  padding: 24px 0;
}

.page-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}

.page-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

.page-btn:disabled {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  padding: 0 8px;
}

.loading {
  border: 4px solid #f3f3f3; 
  border-top: 4px solid #3498db; 
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 2s linear infinite;
  margin: 10px auto; 
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
</style> 