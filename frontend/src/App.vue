<template>
  <nav class="nav">
    <div class="nav-container">
      <router-link to="/" class="nav-logo">
        GitHub Weekly
      </router-link>
      <div class="nav-links">
        <label class="toggle-switch">
          <input type="checkbox" v-model="fullShow" id="fullShow">
          <span class="slider"></span>
          <span class="label-text">{{ fullShow ? '滚动' : '分页' }}</span>
        </label>
        <a href="https://github.com/inshub/iohub" target="_blank" class="nav-link github-link">
          <i class="iconfont icon-github"></i>
        </a>
      </div>
    </div>
  </nav>
  <router-view v-model:fullShow="fullShow"></router-view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const fullShow = ref(true)
</script>

<style>
.nav {
  background: #f9fafb;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-logo {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  text-decoration: none;
  letter-spacing: -0.025em;
}

.nav-links {
  display: flex;
  align-items: center;
}

.nav-link {
  color: #4b5563;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #2563eb;
}

.nav-link.router-link-active {
  color: #2563eb;
}

@media screen and (max-width: 768px) {
  .nav {
    width: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }

  .nav-container {
    height: 56px;
    padding: 0 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .nav-logo {
    font-size: 1.125rem;
  }

  .github-link svg {
    height: 20px;
    width: 20px;
  }
}

@media screen and (max-width: 480px) {
  #app {
    padding-top: 56px;
  }

  .nav-container {
    padding: 0 12px;
  }
}

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 16px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  background-color: #e5e7eb;
  border-radius: 20px;
  transition: .4s;
  margin-right: 8px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  border-radius: 50%;
  transition: .4s;
}

.toggle-switch input:checked + .slider {
  background-color: #2563eb;
}

.toggle-switch input:checked + .slider:before {
  transform: translateX(20px);
}

.label-text {
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
}

@media screen and (max-width: 768px) {
  .label-text {
    display: none;
  }
  
  .toggle-switch {
    margin-right: 12px;
  }
}
</style> 