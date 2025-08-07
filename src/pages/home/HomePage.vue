<template>
  <div class="home-page">
    <!-- 导航栏 -->
    <header class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <img src="@/assets/logo.svg" alt="ZBoot" class="logo" />
          <span class="brand-text">ZBoot前端脚手架</span>
        </div>
        
        <div class="navbar-actions">
          <el-button 
            :icon="isDark ? Sunny : Moon" 
            @click="toggleTheme"
            text
            class="theme-btn"
          />
          <el-button type="primary" @click="showLoginDialog = true">
            登录
          </el-button>
        </div>
      </div>
    </header>
    
    <!-- 主要内容 -->
    <main class="main-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-container">
          <div class="hero-content">
            <h1 class="hero-title">
              <span class="gradient-text">ZBoot</span>
              <br>
              现代化前端脚手架
            </h1>
            <p class="hero-description">
              基于 Vue 3 + TypeScript + Element Plus 构建的企业级前端脚手架，
              提供完整的开发解决方案，让您专注于业务逻辑的实现。
            </p>
            <div class="hero-actions">
              <el-button type="primary" size="large" @click="showLoginDialog = true">
                立即体验
              </el-button>
              <el-button size="large" @click="scrollToFeatures">
                了解更多
              </el-button>
            </div>
          </div>
          
          <div class="hero-image">
            <div class="floating-card card-1">
              <el-icon><Monitor /></el-icon>
              <span>响应式设计</span>
            </div>
            <div class="floating-card card-2">
              <el-icon><Lightning /></el-icon>
              <span>快速开发</span>
            </div>
            <div class="floating-card card-3">
              <el-icon><Lock /></el-icon>
              <span>类型安全</span>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Features Section -->
      <section id="features" class="features-section">
        <div class="container">
          <h2 class="section-title">核心特性</h2>
          <div class="features-grid">
            <div class="feature-card" v-for="feature in features" :key="feature.title">
              <div class="feature-icon">
                <el-icon><component :is="feature.icon" /></el-icon>
              </div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-description">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </section>
      
      <!-- Tech Stack Section -->
      <section class="tech-section">
        <div class="container">
          <h2 class="section-title">技术栈</h2>
          <div class="tech-grid">
            <div class="tech-item" v-for="tech in techStack" :key="tech.name">
              <div class="tech-logo">
                <img :src="tech.logo" :alt="tech.name" />
              </div>
              <h4 class="tech-name">{{ tech.name }}</h4>
              <p class="tech-description">{{ tech.description }}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
    
    <!-- 登录对话框 -->
    <LoginDialog v-model="showLoginDialog" @success="handleLoginSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Moon, 
  Sunny, 
  Monitor, 
  Lightning, 
  Lock
} from '@element-plus/icons-vue'
import { isDark, toggleTheme } from '@/utils/theme'
import LoginDialog from '@/components/common/LoginDialog.vue'

const router = useRouter()

// 登录对话框状态
const showLoginDialog = ref(false)

// 特性列表
const features = [
  {
    icon: 'Setting',
    title: '开箱即用',
    description: '完整的项目结构和配置，无需复杂的初始化过程'
  },
  {
    icon: 'Lock',
    title: '权限管理',
    description: '完善的用户权限和路由拦截机制'
  },
  {
    icon: 'DataAnalysis',
    title: '数据可视化',
    description: '集成图表组件，轻松实现数据展示'
  },
  {
    icon: 'Tools',
    title: '工具丰富',
    description: '内置常用工具函数和组件库'
  },
  {
    icon: 'Cpu',
    title: '性能优化',
    description: '代码分割、懒加载等性能优化方案'
  },
  {
    icon: 'Connection',
    title: 'API集成',
    description: '统一的HTTP请求封装和错误处理'
  }
]

// 技术栈
const techStack = [
  {
    name: 'Vue 3',
    description: '渐进式JavaScript框架',
    logo: 'https://vuejs.org/logo.svg'
  },
  {
    name: 'TypeScript',
    description: 'JavaScript的超集',
    logo: 'https://www.typescriptlang.org/favicon-32x32.png'
  },
  {
    name: 'Element Plus',
    description: 'Vue 3组件库',
    logo: 'https://element-plus.org/images/element-plus-logo-small.svg'
  },
  {
    name: 'Vite',
    description: '下一代前端构建工具',
    logo: 'https://vitejs.dev/logo.svg'
  },
  {
    name: 'Pinia',
    description: 'Vue状态管理',
    logo: 'https://pinia.vuejs.org/logo.svg'
  },
  {
    name: 'Vue Router',
    description: 'Vue官方路由',
    logo: 'https://router.vuejs.org/logo.svg'
  }
]

// 滚动到特性部分
const scrollToFeatures = () => {
  const element = document.getElementById('features')
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

// 登录成功处理
const handleLoginSuccess = () => {
  showLoginDialog.value = false
  ElMessage.success('登录成功')
  router.push('/admin')
}
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-color) 0%, var(--bg-color-page) 100%);
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-extra-light);
  transition: all var(--transition-duration);
  
  [data-theme='dark'] & {
    background: rgba(29, 30, 31, 0.8);
  }
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .logo {
    width: 32px;
    height: 32px;
  }
  
  .brand-text {
    font-size: 20px;
    font-weight: 600;
    color: var(--primary-color);
  }
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.theme-btn {
  font-size: 18px;
}

.main-content {
  padding-top: 60px;
}

.hero-section {
  min-height: 100vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-content {
  animation: slideInLeft 1s ease-out;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  color: var(--text-primary);
}

.gradient-text {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.2rem;
  line-height: 1.6;
  color: var(--text-regular);
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
}

.hero-image {
  position: relative;
  height: 400px;
  animation: slideInRight 1s ease-out;
}

.floating-card {
  position: absolute;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--box-shadow-light);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  color: var(--text-primary);
  animation: float 3s ease-in-out infinite;
  
  .el-icon {
    font-size: 24px;
    color: var(--primary-color);
  }
  
  &.card-1 {
    top: 20%;
    left: 10%;
    animation-delay: 0s;
  }
  
  &.card-2 {
    top: 50%;
    right: 20%;
    animation-delay: 1s;
  }
  
  &.card-3 {
    bottom: 20%;
    left: 20%;
    animation-delay: 2s;
  }
}

.features-section,
.tech-section {
  padding: 80px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 60px;
  color: var(--text-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
}

.feature-card {
  text-align: center;
  padding: 40px 20px;
  border-radius: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  transition: all var(--transition-duration);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: var(--box-shadow-base);
  }
}

.feature-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: var(--primary-extra-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .el-icon {
    font-size: 32px;
    color: var(--primary-color);
  }
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.feature-description {
  color: var(--text-regular);
  line-height: 1.6;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 30px;
}

.tech-item {
  text-align: center;
  padding: 30px 20px;
  border-radius: 12px;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  transition: all var(--transition-duration);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--box-shadow-light);
  }
}

.tech-logo {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.tech-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.tech-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

// 动画
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 40px;
    text-align: center;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .features-grid,
  .tech-grid {
    grid-template-columns: 1fr;
  }
  
  .section-title {
    font-size: 2rem;
  }
}
</style>