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
          <template v-if="isLoggedIn">
            <el-button @click="router.push('/admin')">
              进入管理后台
            </el-button>
            <el-button type="danger" @click="handleLogout">
              退出登录
            </el-button>
          </template>
          <template v-else>
            <el-button type="primary" @click="showLoginDialog = true">
              登录
            </el-button>
          </template>
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
              <el-icon><ChatDotRound /></el-icon>
              <span>AI大模型集成</span>
            </div>
            <div class="floating-card card-2">
              <el-icon><Lightning /></el-icon>
              <span>智能Agent</span>
            </div>
            <div class="floating-card card-3">
              <el-icon><User /></el-icon>
              <span>第三方登录</span>
            </div>
            <div class="floating-card card-4">
              <el-icon><Cellphone /></el-icon>
              <span>小程序端</span>
            </div>
            <div class="floating-card card-5">
              <el-icon><Monitor /></el-icon>
              <span>PC端</span>
            </div>
            <div class="floating-card card-6">
              <el-icon><Iphone /></el-icon>
              <span>iOS端</span>
            </div>
            <div class="floating-card card-7">
              <el-icon><Platform /></el-icon>
              <span>安卓鸿蒙端</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="features-section">
        <div class="container">
          <h2 class="section-title">核心特性</h2>
          <div class="features-grid">
            <div
              class="feature-card"
              :class="{ 'feature-highlight': feature.highlight }"
              v-for="(feature, index) in features"
              :key="feature.title"
              :style="{ animationDelay: `${index * 0.1}s` }"
            >
              <div class="feature-icon" :class="{ 'icon-highlight': feature.highlight }">
                <el-icon><component :is="feature.icon" /></el-icon>
              </div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-description">{{ feature.description }}</p>
              <div v-if="feature.highlight" class="highlight-badge">NEW</div>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Moon, 
  Sunny, 
  Monitor, 
  Lightning, 
  ChatDotRound, // eslint-disable-line
  User, // eslint-disable-line
  Upload, // eslint-disable-line
  Cellphone, // eslint-disable-line
  Search, // eslint-disable-line
  Iphone, // eslint-disable-line
  Platform // eslint-disable-line
} from '@element-plus/icons-vue'
import { isDark, toggleTheme } from '@/utils/theme'
import LoginDialog from '../../components/common/LoginDialog.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 登录对话框状态
const showLoginDialog = ref(false)

// 用户登录状态
const isLoggedIn = computed(() => !!userStore.getToken())

// 退出登录
const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    userStore.logout()
    ElMessage.success('已退出登录')
  } catch {
    // 用户取消退出
  }
}

// 特性列表
const features = [
  {
    icon: 'Setting',
    title: '开箱即用',
    description: '完整的项目结构和配置，二次开发超级简单',
    highlight: true
  },
  {
    icon: 'ChatDotRound',
    title: 'AI大模型集成',
    description: '接入DeepSeek、ChatGPT、Kimi、Claude等主流大模型',
    highlight: true
  },
  {
    icon: 'User',
    title: '第三方登录',
    description: '集成微信登录等多种第三方登录方式'
  },
  {
    icon: 'Upload',
    title: '云存储支持',
    description: '支持阿里云、华为云、腾讯云、MinIO等多种OSS存储'
  },
  {
    icon: 'Cellphone',
    title: '全平台适配',
    description: '小程序、iOS、安卓、鸿蒙、Web、Mac、Win全平台支持',
    highlight: true
  },
  {
    icon: 'Search',
    title: 'SEO优化',
    description: 'SEO自动优化，快速检索到网站内容'
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
  min-height: 80vh;
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
  margin-bottom: 30px;
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
  height: 500px;
  animation: slideInRight 1s ease-out;
  
  @media (max-width: 768px) {
    height: 300px;
    
    .floating-card {
      padding: 16px;
      font-size: 0.9rem;
      
      .el-icon {
        font-size: 20px;
        padding: 6px;
      }
    }
  }
}

.floating-card {
  position: absolute;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  color: var(--text-primary);
  animation: float 3s ease-in-out infinite;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  cursor: pointer;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
    opacity: 0;
    border-radius: 16px;
    transition: opacity 0.3s ease;
    z-index: -1;
  }

  &:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);

    &::before {
      opacity: 0.1;
    }

    .el-icon {
      transform: scale(1.2) rotate(10deg);
    }
  }

  .el-icon {
    font-size: 28px;
    color: var(--primary-color);
    transition: all 0.3s ease;
    padding: 8px;
    background: var(--primary-extra-light);
    border-radius: 50%;
  }

  &.card-1 {
    top: 8%;
    left: 2%;
    animation-delay: 0s;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  }
  
  &.card-2 {
    top: 25%;
    right: 8%;
    animation-delay: 0.5s;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  }
  
  &.card-3 {
    top: 45%;
    left: 8%;
    animation-delay: 1s;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  }
  
  &.card-4 {
    top: 65%;
    right: 2%;
    animation-delay: 1.5s;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  }
  
  &.card-5 {
    bottom: 25%;
    left: 25%;
    animation-delay: 2s;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  }
  
  &.card-6 {
    bottom: 8%;
    right: 25%;
    animation-delay: 2.5s;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  }
  
  &.card-7 {
    bottom: 45%;
    left: 45%;
    animation-delay: 3s;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  }

  [data-theme='dark'] & {
    background: linear-gradient(135deg, rgba(29, 30, 31, 0.9) 0%, rgba(29, 30, 31, 0.7) 100%);
    border-color: var(--border-dark);
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
  position: relative;
  text-align: center;
  padding: 40px 20px;
  border-radius: 16px;
  background: var(--bg-color);
  border: 1px solid var(--border-lighter);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.8s ease-out forwards;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.6s;
  }

  &:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);

    &::before {
      left: 100%;
    }

    .feature-icon {
      transform: scale(1.1) rotate(5deg);
    }
  }

  &.feature-highlight {
    background: linear-gradient(135deg, var(--primary-extra-light) 0%, var(--bg-color) 100%);
    border: 2px solid var(--primary-color);
    box-shadow: 0 8px 25px rgba(64, 158, 255, 0.15);

    &:hover {
      box-shadow: 0 25px 50px rgba(64, 158, 255, 0.25);
    }
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
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.4s ease;
    opacity: 0.2;
  }

  &:hover::before {
    width: 100%;
    height: 100%;
  }

  &.icon-highlight {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
    box-shadow: 0 8px 20px rgba(64, 158, 255, 0.3);

    .el-icon {
      color: white;
    }
  }

  .el-icon {
    font-size: 32px;
    color: var(--primary-color);
    z-index: 1;
    transition: all 0.3s ease;
  }
}

.highlight-badge {
  position: absolute;
  top: 15px;
  right: 15px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
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
    transform: translateY(-15px);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
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
