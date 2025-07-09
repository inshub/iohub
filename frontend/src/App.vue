<template>
  <nav class="nav">
    <div class="nav-container">
      <router-link to="/" class="nav-logo">
        Github Weekly
      </router-link>
      <div class="nav-links">
        <label class="toggle-switch">
          <input type="checkbox" v-model="fullShow" id="fullShow">
          <span class="slider"></span>
          <span class="label-text">{{ fullShow ? '滚动' : '分页' }}</span>
        </label>
        <a href="https://github.com/inshub/iohub" target="_blank" class="nav-link github-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
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
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
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
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: all var(--transition-base);
}

.nav-logo:hover {
  transform: scale(1.02);
}

.nav-logo svg {
  height: 40px;
  width: 40px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-link {
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: color var(--transition-base);
  padding: 8px 12px;
  border-radius: var(--radius-md);
}

.nav-link:hover {
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.nav-link.router-link-active {
  color: var(--color-primary);
  background: var(--color-primary-light);
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

  .nav-logo svg {
    height: 36px;
    width: 36px;
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
  gap: 8px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  background-color: var(--color-bg-secondary);
  border-radius: 24px;
  transition: all var(--transition-base);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 2px;
  background-color: var(--color-bg-primary);
  border-radius: 50%;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.toggle-switch input:checked + .slider {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.toggle-switch input:checked + .slider:before {
  transform: translateX(20px);
}

.label-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  font-weight: 500;
  transition: color var(--transition-base);
}

.toggle-switch:hover .label-text {
  color: var(--color-primary);
}

@media screen and (max-width: 768px) {
  .label-text {
    display: none;
  }
  
  .toggle-switch {
    gap: 12px;
  }
}
</style> 