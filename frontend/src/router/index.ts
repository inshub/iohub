import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Article from '../views/Article.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    {
      path: '/article/:id',
      name: 'article',
      component: Article,
      props: true
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // 当从文章页面导航到首页时，阻止默认滚动行为
    if (from.name === 'article' && to.name === 'home') {
      return false
    }
    
    // 其他情况使用默认行为
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

export default router 