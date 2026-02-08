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
.home-page {
  min-height: 100vh;
  background: var(--bg-color);
  color: var(--text-primary);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  overflow-x: hidden;
  position: relative;
  transition: background-color 0.3s, color 0.3s;
}

// Navbar
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100;
  backdrop-filter: blur(12px);
  background: rgba(var(--bg-color), 0.7); // This won't work directly with hex var, need workaround or RGB vars.
  // Let's use --glass-bg instead or simple background with opacity
  background: var(--glass-bg);
  border-bottom: 1px solid var(--border-extra-light);
}

.navbar-container {
  max-width: 1280px;
  margin: 0 auto;
  height: 70px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;

  .logo {
    height: 36px;
    width: 36px;
  }

  .brand-text {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--text-primary);
  }
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;

  .nav-btn {
    &.primary {
      background: var(--primary-color);
      border: none;
      color: white;

      &:hover {
        background: var(--primary-light);
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
  padding-top: 70px;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  inset: 0;
  z-index: 0;

  .glow-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.4;

    &.orb-1 {
      width: 500px;
      height: 500px;
      background: var(--primary-color);
      top: -100px;
      left: -100px;
    }

    &.orb-2 {
      width: 400px;
      height: 400px;
      background: var(--secondary-color);
      bottom: -50px;
      right: -50px;
    }
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--border-extra-light) 1px, transparent 1px),
      linear-gradient(90deg, var(--border-extra-light) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
  }
}

.hero-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
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
    gap: 80px;
  }
}

.hero-content {
  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: var(--glass-border);
    border: 1px solid var(--border-extra-light);
    border-radius: 100px;
    font-size: 14px;
    color: var(--primary-light);
    margin-bottom: 24px;

    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--primary-light);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--primary-light);
      animation: pulse 2s infinite;
    }
  }

  .hero-title {
    font-size: 56px;
    line-height: 1.1;
    font-weight: 800;
    margin-bottom: 24px;
    letter-spacing: -1px;
    color: var(--text-primary);

    .gradient-text {
      background: linear-gradient(135deg, var(--primary-light), var(--secondary-color));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    @media (max-width: 768px) {
      font-size: 40px;
    }

    @media (max-width: 480px) {
      font-size: 32px;
    }
  }

  .hero-description {
    font-size: 18px;
    line-height: 1.6;
    color: var(--text-secondary);
    margin-bottom: 40px;
    max-width: 540px;

    @media (max-width: 1024px) {
      margin-left: auto;
      margin-right: auto;
    }
  }
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 48px;

  @media (max-width: 1024px) {
    justify-content: center;
  }

  .cta-btn {
    border-radius: 12px;
    font-weight: 600;
    padding: 20px 32px;

    &.primary {
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      border: none;
      box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
      color: white;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(59, 130, 246, 0.5);
      }
    }

    &.secondary {
      background: var(--glass-border);
      border: 1px solid var(--border-extra-light);
      color: var(--text-primary);

      &:hover {
        background: var(--border-light);
      }
    }
  }
}

.hero-stats {
    display: flex;
    align-items: center;
    gap: 32px;
    padding-top: 32px;
    border-top: 1px solid var(--border-extra-light);
    flex-wrap: wrap;

    @media (max-width: 1024px) {
      justify-content: center;
    }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border-extra-light);
}
}

// Common Section Header
.section-header {
  text-align: center;
  margin-bottom: 60px;

  .section-title {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 16px;
    color: var(--text-primary);
  }

  .section-subtitle {
    color: var(--text-secondary);
    font-size: 18px;
  }
}

// Orbit Animation System
.orbit-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 600px;
  perspective: 1000px;

  @media (max-width: 768px) {
    height: 400px;
    transform: scale(0.7);
  }
}

.orbit-system {
  position: relative;
  width: 500px;
  height: 500px;
  transform-style: preserve-3d;
}

.core-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  z-index: 10;

  .core-glow {
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, var(--glow-color), transparent 70%);
    filter: blur(20px);
    animation: pulse-glow 4s infinite alternate;
  }

  .core-content {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 50px rgba(59, 130, 246, 0.2);

    .core-icon {
      font-size: 32px;
      color: var(--primary-light);
      margin-bottom: 4px;
    }

    .core-title {
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 1px;
      color: var(--text-primary);
    }

    .core-subtitle {
      font-size: 10px;
      color: var(--text-secondary);
      margin-top: 4px;
    }
  }
}

.orbit-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid var(--border-extra-light);

  &.ring-1 { width: 250px; height: 250px; opacity: 0.5; }
  &.ring-2 { width: 380px; height: 380px; border-style: dashed; opacity: 0.3; }
  &.ring-3 { width: 500px; height: 500px; opacity: 0.2; }
}

.orbit-rotator {
  position: absolute;
  inset: 0;
  animation: rotate 30s linear infinite;
}

.orbit-item-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: rotate(var(--angle)) translate(190px); // Radius of 190px

  .orbit-item {
    animation: counter-rotate 30s linear infinite;

    .orbit-content-fix {
      transform: rotate(calc(var(--angle) * -1));
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 100px;
    }

    .item-icon {
      width: 48px;
      height: 48px;
      background: var(--bg-surface);
      border: 1px solid var(--border-extra-light);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: var(--primary-light);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
    }

    .item-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--text-secondary);
      text-align: center;
      white-space: nowrap;
    }

    &:hover .item-icon {
      transform: scale(1.1);
      background: var(--primary-color);
      color: white;
      box-shadow: 0 0 20px var(--glow-color);
    }
  }
}

// Features Section
.features-section {
  padding: 100px 0;
  background: var(--bg-surface);

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 32px;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;

    .feature-card {
      background: var(--card-bg);
      border: 1px solid var(--border-light);
      padding: 36px 32px;
      border-radius: 24px;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), var(--border-light), transparent 40%);
        opacity: 0;
        transition: opacity 0.5s;
        pointer-events: none;
      }

      &:hover {
        background: var(--bg-color-soft);
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        border-color: rgba(59, 130, 246, 0.3);

        &::before {
          opacity: 1;
        }

        .feature-icon-box {
          background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
          color: white;
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }
      }

      .feature-icon-box {
        width: 56px;
        height: 56px;
        background: var(--bg-color-page);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: var(--primary-light);
        margin-bottom: 24px;
        transition: all 0.4s ease;
      }

      .feature-title {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 12px;
        color: var(--text-primary);
      }

      .feature-desc {
        color: var(--text-secondary);
        line-height: 1.6;
        font-size: 15px;
      }
    }
  }
}

// Tech Stack
.tech-section {
  padding: 100px 0;
  border-top: 1px solid var(--border-extra-light);
  background: linear-gradient(to bottom, var(--bg-surface), var(--bg-color));

  .tech-grid {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 50px;
    margin-top: 60px;
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
    padding: 0 20px;

    .tech-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      transition: transform 0.3s;

      &:hover {
        transform: translateY(-5px);

        .tech-logo-wrapper {
          box-shadow: 0 0 30px var(--glow-color);
          border-color: var(--primary-light);
        }

        .tech-name {
          color: var(--primary-light);
        }
      }

      .tech-logo-wrapper {
        width: 88px;
        height: 88px;
        background: white; /* Keep white for logos that need it */
        border-radius: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
        border: 2px solid transparent;
        padding: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);

        .tech-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }

      .tech-name {
        font-weight: 600;
        font-size: 16px;
        color: var(--text-secondary);
        transition: color 0.3s;
      }
    }
  }
}

// Footer
.footer {
  padding: 60px 0 30px;
  border-top: 1px solid var(--border-extra-light);
  background: var(--bg-color);

  .footer-content {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 24px;
    }
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--text-secondary);

    .footer-logo {
      height: 32px;
      filter: grayscale(1);
      opacity: 0.6;
    }
  }

  .footer-links {
    display: flex;
    gap: 24px;

    a {
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 14px;
      transition: color 0.2s;

      &:hover {
        color: var(--primary-light);
      }
    }
  }
}

// Dialogs
.custom-dialog {
  :deep(.el-dialog__body) {
    padding: 20px 30px;
  }

  .contact-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 20px;

    .contact-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;

      .qr-wrapper {
        width: 100px;
        height: 100px;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }

      .platform-info {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        font-weight: 600;
        color: #334155;
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

@keyframes pulse-glow {
  0% { opacity: 0.3; transform: scale(0.95); }
  100% { opacity: 0.6; transform: scale(1.05); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes counter-rotate {
  from { transform: rotate(360deg); } // Counter acts the rotation
  to { transform: rotate(0deg); }
}
</style>
