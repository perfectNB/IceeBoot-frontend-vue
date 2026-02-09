<template>
  <div class="home-page">
    <!-- 导航栏 -->
    <header class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <img src="@/assets/logo.svg" alt="IceeBoot" class="logo" />
          <span class="brand-text">IceeBoot</span>
        </div>

        <div class="navbar-actions">
          <el-button
            :icon="isDark ? Sunny : Moon"
            @click="toggleTheme"
            text
            circle
            class="theme-btn"
          />
          <template v-if="isLoggedIn">
            <el-button class="nav-btn" @click="goToFirstMenu">
              控制台
            </el-button>
            <el-button class="nav-btn logout" text @click="handleLogout">
              退出
            </el-button>
          </template>
          <template v-else>
            <el-button class="nav-btn primary" @click="showLoginDialog = true">
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
        <div class="hero-background">
          <div class="glow-orb orb-1"></div>
          <div class="glow-orb orb-2"></div>
          <div class="grid-overlay"></div>
        </div>

        <div class="hero-container">
          <div class="hero-content">
            <div class="hero-badge">
              <span class="pulse-dot"></span>
              AI 原生企业级脚手架
            </div>
            <h1 class="hero-title">
              构建未来的
              <span class="gradient-text">智能应用</span>
            </h1>
            <p class="hero-description">
              IceeBoot 是基于 Vue 3 + TypeScript + Element Plus 的下一代企业级开发平台。
              深度集成 AI 能力，提供从设计到部署的全链路解决方案。
            </p>
            <div class="hero-actions">
              <el-button class="cta-btn primary" size="large" @click="handleExperience">
                立即体验
                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
              </el-button>
              <el-button class="cta-btn secondary" size="large" @click="openOfficialDocs">
                文档中心
              </el-button>
            </div>

            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-value">30+</span>
                <span class="stat-label">开箱模块</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">50+</span>
                <span class="stat-label">企业方案</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <span class="stat-value">10x</span>
                <span class="stat-label">开发提效</span>
              </div>
            </div>
          </div>

          <!-- Orbit System -->
          <div class="orbit-container">
            <div class="orbit-system">
              <!-- Central Core -->
              <div class="core-wrapper">
                <div class="core-glow"></div>
                <div class="core-content">
                  <div class="core-icon">
                    <el-icon><Cpu /></el-icon>
                  </div>
                  <span class="core-title">AI Core</span>
                  <span class="core-subtitle">Workflow • Auth • Data</span>
                </div>
              </div>

              <!-- Orbital Rings -->
              <div class="orbit-ring ring-1"></div>
              <div class="orbit-ring ring-2"></div>
              <div class="orbit-ring ring-3"></div>

              <!-- Orbiting Items -->
              <div class="orbit-rotator">
                <div
                  v-for="(item, index) in orbitItems"
                  :key="index"
                  class="orbit-item-wrapper"
                  :style="{ '--angle': `${index * (360 / orbitItems.length)}deg` }"
                >
                  <div class="orbit-item">
                    <div class="orbit-content-fix">
                      <div class="item-icon">
                        <el-icon><component :is="item.icon" /></el-icon>
                      </div>
                      <span class="item-label">{{ item.label }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="features-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">核心特性</h2>
            <p class="section-subtitle">不仅仅是模板，更是生产力工具</p>
          </div>
          <div class="features-grid">
            <div
              class="feature-card"
              v-for="(feature, index) in features"
              :key="feature.title"
              :style="{ '--delay': `${index * 0.1}s` }"
              @mousemove="handleMouseMove"
            >
              <div class="feature-icon-box">
                <el-icon><component :is="feature.icon" /></el-icon>
              </div>
              <h3 class="feature-title">{{ feature.title }}</h3>
              <p class="feature-desc">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Tech Stack Section -->
      <section class="tech-section">
        <div class="container">
          <div class="section-header">
            <h2 class="section-title">技术栈</h2>
            <p class="section-subtitle">采用行业前沿技术构建，确保项目的长期生命力</p>
          </div>
          <div class="tech-grid">
            <div class="tech-item" v-for="tech in techStack" :key="tech.name">
              <div class="tech-logo-wrapper">
                <img :src="tech.logo" :alt="tech.name" class="tech-logo" />
              </div>
              <h4 class="tech-name">{{ tech.name }}</h4>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-brand">
          <img src="@/assets/logo.svg" alt="IceeBoot" class="footer-logo" />
          <p>© 2024 IceeBoot. All rights reserved.</p>
        </div>
        <div class="footer-links">
          <a href="https://gitee.com/woshinibaba438cnmlgb/zboot-backend-java" target="_blank">Gitee</a>
          <a href="https://doc.iceeboot.yxycompany.com" target="_blank">文档</a>
          <a href="#" @click.prevent="showContactDialog = true">联系我们</a>
          <a href="https://beian.miit.gov.cn/" target="_blank">京ICP备2024086986号-2</a>
        </div>
      </div>
    </footer>

    <!-- Dialogs -->
    <LoginDialog v-model="showLoginDialog" @success="handleLoginSuccess" />

    <el-dialog
      v-model="showMockDialog"
      title="Mock 模式提示"
      width="400px"
      class="custom-dialog"
      align-center
    >
      <div class="mock-content">
        <el-icon class="warning-icon"><Warning /></el-icon>
        <p>当前处于演示模式，数据仅供参考。</p>
      </div>
      <template #footer>
        <el-button @click="showMockDialog = false">我知道了</el-button>
        <el-button type="primary" @click="openGitee">获取源码</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showContactDialog"
      title="联系我们"
      width="600px"
      class="custom-dialog"
      align-center
    >
      <div class="contact-grid">
        <div class="contact-item" v-for="platform in socialPlatforms" :key="platform.name">
          <div class="qr-wrapper">
            <img :src="platform.qrCode" :alt="platform.name" />
          </div>
          <div class="platform-info">
            <i :class="platform.icon" :style="{ color: platform.color }"></i>
            <span>{{ platform.name }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Moon,
  Sunny,
  Monitor,
  Lightning,
  ChatDotRound,
  User,
  Upload, // eslint-disable-line
  Cellphone,
  Search, // eslint-disable-line
  Iphone,
  Platform,
  Warning,
  Cpu,
  ArrowRight,
  Setting,
  Lock,
  DataAnalysis,
  Tools,
  Connection
} from '@element-plus/icons-vue'
import { isDark, toggleTheme } from '@/utils/theme'
import LoginDialog from '../../components/common/LoginDialog.vue'
import { useUserStore } from '@/stores/user'
import { isMockEnabled } from '@/config/mock'
import { exchangeWechatTicket } from '@/api'
import type { MenuItem } from '@/types'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const showLoginDialog = ref(false)
const isLoggedIn = computed(() => !!userStore.getToken())
const showMockDialog = ref(false)
const showContactDialog = ref(false)

// Orbit Items Configuration
const orbitItems = [
  { icon: ChatDotRound, label: 'AI大模型' },
  { icon: Lightning, label: '智能Agent' },
  { icon: User, label: '第三方登录' },
  { icon: Cellphone, label: '小程序端' },
  { icon: Monitor, label: 'PC端' },
  { icon: Iphone, label: 'iOS端' },
  { icon: Platform, label: '安卓鸿蒙' }
]

// Social Platforms
const socialPlatforms = [
  {
    name: '哔哩哔哩',
    description: '关注我们的B站账号',
    icon: 'fab fa-bilibili',
    color: '#00A1D6',
    qrCode: new URL('@/assets/img/qr-code/bilibili.png', import.meta.url).href
  },
  {
    name: '抖音',
    description: '关注我们的抖音账号',
    icon: 'fab fa-tiktok',
    color: '#FE2C55',
    qrCode: new URL('@/assets/img/qr-code/dy.png', import.meta.url).href
  },
  {
    name: '小红书',
    description: '关注我们的小红书账号',
    icon: 'fas fa-book',
    color: '#FF2442',
    qrCode: new URL('@/assets/img/qr-code/xhs.png', import.meta.url).href
  },
  {
    name: '微信',
    description: '添加我们的微信',
    icon: 'fab fa-weixin',
    color: '#07C160',
    qrCode: new URL('@/assets/img/qr-code/wx.png', import.meta.url).href
  },
  {
    name: 'QQ',
    description: '添加我们的QQ',
    icon: 'fab fa-qq',
    color: '#12B7F5',
    qrCode: new URL('@/assets/img/qr-code/qq.png', import.meta.url).href
  },
  {
    name: '微信群',
    description: '加入我们的微信群',
    icon: 'fas fa-users',
    color: '#07C160',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzA3QzE2MCIvPjx0ZXh0IHg9Ijc1IiB5PSI2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuW+ruS/oeS6pDwvdGV4dD48dGV4dCB4PSI3NSIgeT0iODUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7kuqTmtYE8L3RleHQ+PC9zdmc+'
  }
]

const normalizeMenuPath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`
}

const resolveFirstMenuPath = (menus?: MenuItem[]): string | null => {
  if (!menus || menus.length === 0) return null
  for (const menu of menus) {
    if (menu.type === 'link') continue
    if (menu.children && menu.children.length > 0) {
      const childPath = resolveFirstMenuPath(menu.children)
      if (childPath) return childPath
    }
    if (menu.path) return normalizeMenuPath(menu.path)
  }
  return null
}

const goToFirstMenu = () => {
  const target = resolveFirstMenuPath(userStore.user?.menus) || '/404'
  router.push(target)
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    userStore.logout()
    ElMessage.success('已退出登录')
  } catch { /* cancelled */ }
}

const handleMouseMove = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  target.style.setProperty('--mouse-x', `${x}px`)
  target.style.setProperty('--mouse-y', `${y}px`)
}

const features = [
  { icon: Setting, title: '开箱即用', description: '完整的项目结构和配置，二次开发超级简单', highlight: true },
  { icon: ChatDotRound, title: 'AI大模型集成', description: '接入DeepSeek、ChatGPT、Kimi、Claude等主流大模型', highlight: true },
  { icon: User, title: '第三方登录', description: '集成微信登录等多种第三方登录方式' },
  { icon: Upload, title: '云存储支持', description: '支持阿里云、华为云、腾讯云、MinIO等多种OSS存储' },
  { icon: Cellphone, title: '全平台适配', description: '小程序、iOS、安卓、鸿蒙、Web、Mac、Win全平台支持', highlight: true },
  { icon: Search, title: 'SEO优化', description: 'SEO自动优化，快速检索到网站内容' },
  { icon: Lock, title: '权限管理', description: '完善的用户权限和路由拦截机制' },
  { icon: DataAnalysis, title: '数据可视化', description: '集成图表组件，轻松实现数据展示' },
  { icon: Tools, title: '工具丰富', description: '内置常用工具函数和组件库' },
  { icon: Cpu, title: '性能优化', description: '代码分割、懒加载等性能优化方案' },
  { icon: Connection, title: 'API集成', description: '统一的HTTP请求封装和错误处理' }
]

const techStack = [
  { name: 'Vue 3', logo: 'https://vuejs.org/logo.svg' },
  { name: 'TypeScript', logo: 'https://www.typescriptlang.org/favicon-32x32.png' },
  { name: 'Element Plus', logo: 'https://element-plus.org/images/element-plus-logo-small.svg' },
  { name: 'Vite', logo: 'https://vitejs.dev/logo.svg' },
  { name: 'Pinia', logo: 'https://pinia.vuejs.org/logo.svg' },
  { name: 'Vue Router', logo: 'https://router.vuejs.org/logo.svg' }
]

const handleExperience = () => {
  window.open('https://gitee.com/woshinibaba438cnmlgb/zboot-backend-java', '_blank')
}

const openOfficialDocs = () => {
  window.open('https://doc.iceeboot.yxycompany.com', '_blank')
}

const openGitee = () => {
  window.open('https://gitee.com/woshinibaba438cnmlgb/zboot-backend-java', '_blank')
  showMockDialog.value = false
}

const checkMockMode = () => {
  if (isMockEnabled()) {
    setTimeout(() => { showMockDialog.value = true }, 2000)
  }
}

const resolveSingleQueryValue = (value: unknown): string => {
  if (!value) return ''
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' ? first : ''
  }
  return typeof value === 'string' ? value : ''
}

const handleLoginSuccess = () => {
  showLoginDialog.value = false
  goToFirstMenu()
}

const handleWechatCallback = async () => {
  const errorMessage = resolveSingleQueryValue(route.query.error)
  if (errorMessage) {
    ElMessage.error(errorMessage)
    showLoginDialog.value = true
    await router.replace({ path: '/', query: {} })
    return
  }
  const ticket = resolveSingleQueryValue(route.query.ticket)
  if (!ticket) return
  try {
    const response = await exchangeWechatTicket(ticket)
    userStore.setAuthTokens(response)
    userStore.setUser(response.user)
    await router.replace({ path: '/', query: {} })
    goToFirstMenu()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败')
    showLoginDialog.value = true
    await router.replace({ path: '/', query: {} })
  }
}

onMounted(() => {
  checkMockMode()
  handleWechatCallback()
})
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');

.home-page {
  min-height: 100vh;
  background: var(--bg-color);
  color: var(--text-primary);
  font-family: 'Syne', system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
  position: relative;
  transition: background-color 0.3s, color 0.3s;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
}

// Navbar
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100;
  backdrop-filter: blur(20px) saturate(180%);
  background: rgba(255, 255, 255, 0.7);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (prefers-color-scheme: dark) {
    background: rgba(15, 23, 42, 0.7);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(59, 130, 246, 0.3) 50%,
      transparent 100%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover::after {
    opacity: 1;
  }
}

.navbar-container {
  max-width: 1280px;
  margin: 0 auto;
  height: 72px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  position: relative;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-2px);
  }

  .logo {
    height: 32px;
    width: 32px;
    filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3));
    transition: filter 0.3s;

    &:hover {
      filter: drop-shadow(0 6px 16px rgba(59, 130, 246, 0.5));
    }
  }

  .brand-text {
    font-size: 25px;
    font-weight: 600;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;

  .theme-btn {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: rotate(180deg) scale(1.1);
    }
  }

  .nav-btn {
    font-weight: 600;
    border-radius: 12px;
    padding: 10px 24px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    &:hover::before {
      width: 300px;
      height: 300px;
    }

    &.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border: none;
      color: white;
      box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
      }

      &:active {
        transform: translateY(0);
      }
    }

    &.logout {
      &:hover {
        color: #ef4444;
      }
    }
  }
}

// Hero Section
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding-top: 72px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.3;
    animation: float 20s ease-in-out infinite;

    &.orb-1 {
      width: 600px;
      height: 600px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      top: -150px;
      left: -150px;
      animation-delay: 0s;
    }

    &.orb-2 {
      width: 500px;
      height: 500px;
      background: linear-gradient(135deg, #ec4899, #f59e0b);
      bottom: -100px;
      right: -100px;
      animation-delay: -10s;
    }
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(circle at center, black 30%, transparent 70%);
    animation: grid-flow 20s linear infinite;
  }
}

.hero-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  position: relative;
  z-index: 1;
  align-items: center;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 60px;
    padding: 0 24px;
  }
}

.hero-content {
  animation: fade-in-up 1s ease-out;

  @media (max-width: 1024px) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 20px;
    background: rgba(59, 130, 246, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 100px;
    font-size: 13px;
    font-weight: 600;
    color: #3b82f6;
    margin-bottom: 32px;
    letter-spacing: 0.5px;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #3b82f6;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
      animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
    }
  }

  .hero-title {
    font-size: 56px;
    line-height: 1.2;
    font-weight: 800;
    margin-bottom: 28px;
    letter-spacing: -2px;
    color: var(--text-primary);
    white-space: nowrap;

    .gradient-text {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: gradient-shift 8s ease infinite;
      background-size: 200% 200%;
    }

    @media (max-width: 768px) {
      font-size: 36px;
      white-space: normal;
    }

    @media (max-width: 480px) {
      font-size: 28px;
      white-space: normal;
    }
  }

  .hero-description {
    font-size: 17px;
    line-height: 1.7;
    color: var(--text-secondary);
    margin-bottom: 48px;
    max-width: 560px;
    font-weight: 400;

    @media (max-width: 1024px) {
      margin-left: auto;
      margin-right: auto;
      max-width: 500px;
    }
  }
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 56px;

  @media (max-width: 1024px) {
    justify-content: center;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }

  .cta-btn {
    border-radius: 14px;
    font-weight: 700;
    padding: 16px 32px;
    font-size: 15px;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;

    @media (max-width: 480px) {
      width: 100%;
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.5s;
    }

    &:hover::before {
      left: 100%;
    }

    &.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border: none;
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
      color: white;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 16px 48px rgba(59, 130, 246, 0.5);
      }

      &:active {
        transform: translateY(-2px);
      }
    }

    &.secondary {
      background: rgba(59, 130, 246, 0.08);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(59, 130, 246, 0.2);
      color: var(--text-primary);

      &:hover {
        background: rgba(59, 130, 246, 0.15);
        border-color: rgba(59, 130, 246, 0.4);
        transform: translateY(-2px);
      }
    }
  }
}

.hero-stats {
    display: flex;
    align-items: center;
    gap: 32px;
    padding-top: 40px;
    border-top: 1px solid rgba(59, 130, 246, 0.15);
    flex-wrap: wrap;

    @media (max-width: 1024px) {
      justify-content: center;
    }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: translateY(-4px);
    }

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }

    .stat-label {
    font-size: 13px;
    color: var(--text-secondary);
    font-weight: 500;
  }
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.3), transparent);
}
}

// Common Section Header
.section-header {
  text-align: center;
  margin-bottom: 80px;
  animation: fade-in-up 1s ease-out;

  .section-title {
    font-size: 42px;
    font-weight: 800;
    margin-bottom: 20px;
    letter-spacing: -1.2px;
    background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (max-width: 768px) {
      font-size: 32px;
    }
  }

  .section-subtitle {
    color: var(--text-secondary);
    font-size: 16px;
    font-weight: 400;
    max-width: 600px;
    margin: 0 auto;
  }
}

// Orbit Animation System
.orbit-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 600px;
  perspective: 1200px;
  animation: fade-in 1.2s ease-out 0.3s both;

  @media (max-width: 1024px) {
    height: 500px;
  }

  @media (max-width: 768px) {
    height: 400px;
    transform: scale(0.8);
  }

  @media (max-width: 480px) {
    height: 350px;
    transform: scale(0.65);
  }
}

.orbit-system {
  position: relative;
  width: 500px;
  height: 500px;
  transform-style: preserve-3d;
  animation: gentle-float 6s ease-in-out infinite;
}

.core-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 160px;
  height: 160px;
  z-index: 10;
  animation: core-pulse 4s ease-in-out infinite;

  .core-glow {
    position: absolute;
    inset: -30px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent 70%);
    filter: blur(30px);
    animation: pulse-glow 4s infinite alternate;
  }

  .core-content {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
    backdrop-filter: blur(20px) saturate(180%);
    border: 2px solid rgba(59, 130, 246, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 0 60px rgba(59, 130, 246, 0.3),
      inset 0 0 40px rgba(59, 130, 246, 0.1);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: scale(1.05);
      border-color: rgba(59, 130, 246, 0.6);
      box-shadow:
        0 0 80px rgba(59, 130, 246, 0.5),
        inset 0 0 60px rgba(59, 130, 246, 0.2);
    }

    .core-icon {
      font-size: 40px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
      animation: icon-float 3s ease-in-out infinite;
    }

    .core-title {
      font-weight: 800;
      font-size: 20px;
      letter-spacing: 1px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .core-subtitle {
      font-size: 10px;
      color: var(--text-secondary);
      margin-top: 6px;
      font-family: 'Space Mono', monospace;
      letter-spacing: 0.5px;
    }
  }
}

.orbit-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(59, 130, 246, 0.15);
  transition: all 0.3s;

  &.ring-1 {
    width: 250px;
    height: 250px;
    opacity: 0.6;
    border-width: 2px;
    border-color: rgba(59, 130, 246, 0.2);
  }

  &.ring-2 {
    width: 380px;
    height: 380px;
    border-style: dashed;
    opacity: 0.4;
    animation: ring-pulse 3s ease-in-out infinite;
  }

  &.ring-3 {
    width: 500px;
    height: 500px;
    opacity: 0.3;
    border-width: 1px;
  }
}

.orbit-rotator {
  position: absolute;
  inset: 0;
  animation: rotate 40s linear infinite;
}

.orbit-item-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: rotate(var(--angle)) translate(190px);

  .orbit-item {
    animation: counter-rotate 40s linear infinite;

    .orbit-content-fix {
      transform: rotate(calc(var(--angle) * -1));
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      width: 100px;
    }

    .item-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
      backdrop-filter: blur(10px);
      border: 2px solid rgba(59, 130, 246, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      color: #3b82f6;
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .item-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      text-align: center;
      white-space: nowrap;
      transition: all 0.3s;
    }

    &:hover .item-icon {
      transform: scale(1.15) rotate(-5deg);
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      color: white;
      border-color: transparent;
      box-shadow: 0 12px 40px rgba(59, 130, 246, 0.4);
    }

    &:hover .item-label {
      color: #3b82f6;
      transform: translateY(-2px);
    }
  }
}

// Features Section
.features-section {
  padding: 120px 0;
  background: linear-gradient(to bottom, var(--bg-color), var(--bg-surface));
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(59, 130, 246, 0.3) 50%,
      transparent 100%);
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 32px;

    .feature-card {
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(59, 130, 246, 0.1);
      padding: 40px 32px;
      border-radius: 24px;
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
      animation: fade-in-up 0.8s ease-out both;
      animation-delay: var(--delay);

      @media (prefers-color-scheme: dark) {
        background: rgba(15, 23, 42, 0.5);
      }

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(600px circle at var(--mouse-x) var(--mouse-y),
          rgba(59, 130, 246, 0.1),
          transparent 40%);
        opacity: 0;
        transition: opacity 0.5s;
        pointer-events: none;
      }

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899);
        transform: scaleX(0);
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      &:hover {
        background: rgba(255, 255, 255, 0.8);
        transform: translateY(-12px);
        box-shadow: 0 24px 48px rgba(59, 130, 246, 0.2);
        border-color: rgba(59, 130, 246, 0.3);

        @media (prefers-color-scheme: dark) {
          background: rgba(15, 23, 42, 0.8);
        }

        &::before {
          opacity: 1;
        }

        &::after {
          transform: scaleX(1);
        }

        .feature-icon-box {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          transform: scale(1.1) rotate(-5deg);
          box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
        }

        .feature-title {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      .feature-icon-box {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: #3b82f6;
        margin-bottom: 24px;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 2px solid rgba(59, 130, 246, 0.2);
      }

      .feature-title {
        font-size: 22px;
        font-weight: 700;
        margin-bottom: 12px;
        color: var(--text-primary);
        transition: all 0.3s;
        letter-spacing: -0.5px;
      }

      .feature-desc {
        color: var(--text-secondary);
        line-height: 1.7;
        font-size: 15px;
        font-weight: 400;
      }
    }
  }
}

// Tech Stack
.tech-section {
  padding: 120px 0;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  background: linear-gradient(to bottom, var(--bg-surface), var(--bg-color));
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    height: 800px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.05), transparent 70%);
    pointer-events: none;
  }

  .tech-grid {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 60px;
    margin-top: 80px;
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
    padding: 0 32px;
    position: relative;
    z-index: 1;

    .tech-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      animation: fade-in-up 0.8s ease-out both;
      animation-delay: calc(var(--index, 0) * 0.1s);

      &:hover {
        transform: translateY(-12px);

        .tech-logo-wrapper {
          box-shadow: 0 16px 48px rgba(59, 130, 246, 0.3);
          border-color: #3b82f6;
          transform: rotate(-5deg);
        }

        .tech-name {
          color: #3b82f6;
        }
      }

      .tech-logo-wrapper {
        width: 100px;
        height: 100px;
        background: white;
        border-radius: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 2px solid rgba(59, 130, 246, 0.1);
        padding: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
        position: relative;
        overflow: hidden;

        &::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
          opacity: 0;
          transition: opacity 0.3s;
        }

        &:hover::before {
          opacity: 1;
        }

        .tech-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          position: relative;
          z-index: 1;
        }
      }

      .tech-name {
        font-weight: 700;
        font-size: 16px;
        color: var(--text-secondary);
        transition: color 0.3s;
        letter-spacing: -0.3px;
      }
    }
  }
}

// Footer
.footer {
  padding: 80px 0 40px;
  border-top: 1px solid rgba(59, 130, 246, 0.1);
  background: var(--bg-color);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(59, 130, 246, 0.3) 50%,
      transparent 100%);
  }

  .footer-content {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 32px;
    }
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--text-secondary);
    font-size: 14px;

    .footer-logo {
      height: 36px;
      filter: grayscale(0.5);
      opacity: 0.7;
      transition: all 0.3s;

      &:hover {
        filter: grayscale(0);
        opacity: 1;
      }
    }
  }

  .footer-links {
    display: flex;
    gap: 32px;

    a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 0;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        transition: width 0.3s;
      }

      &:hover {
        color: #3b82f6;

        &::after {
          width: 100%;
        }
      }
    }
  }
}

// Dialogs
.custom-dialog {
  :deep(.el-dialog) {
    border-radius: 24px;
    overflow: hidden;
    backdrop-filter: blur(20px);
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  }

  :deep(.el-dialog__body) {
    padding: 32px;
  }

  .mock-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 20px 0;

    .warning-icon {
      font-size: 48px;
      color: #f59e0b;
    }

    p {
      font-size: 16px;
      color: var(--text-secondary);
      text-align: center;
    }
  }

  .contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 24px;

    .contact-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(139, 92, 246, 0.05));
      border-radius: 16px;
      border: 1px solid rgba(59, 130, 246, 0.1);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 12px 32px rgba(59, 130, 246, 0.2);
        border-color: rgba(59, 130, 246, 0.3);
      }

      .qr-wrapper {
        width: 120px;
        height: 120px;
        border-radius: 12px;
        overflow: hidden;
        border: 2px solid rgba(59, 130, 246, 0.2);

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }

      .platform-info {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        font-weight: 700;
        color: var(--text-primary);

        i {
          font-size: 16px;
        }
      }
    }
  }
}

// Animations
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse-ring {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

@keyframes pulse-glow {
  0% { opacity: 0.3; transform: scale(0.95); }
  100% { opacity: 0.6; transform: scale(1.05); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes counter-rotate {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

@keyframes grid-flow {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 60px 60px;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes gentle-float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes core-pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.02);
  }
}

@keyframes icon-float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes ring-pulse {
  0%, 100% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1.02);
  }
}
</style>
