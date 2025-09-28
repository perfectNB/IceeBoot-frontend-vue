<template>
  <div class="home-page">
    <!-- 导航栏 -->
    <header class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <img src="@/assets/logo.svg" alt="IceeBoot" class="logo" />
          <span class="brand-text">IceeBoot超级脚手架</span>
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
              <span class="gradient-text">IceeBoot</span>
              <br>
              AI化超级脚手架
            </h1>
            <p class="hero-description">
              基于 Vue 3 + TypeScript + Element Plus 构建的企业级前端脚手架，
              提供完整的开发解决方案，让您专注于业务逻辑的实现。
            </p>
            <div class="hero-actions">
              <el-button type="primary" size="large" @click="handleExperience">
                立即体验
              </el-button>
              <el-button size="large" @click="scrollToFeatures">
                了解更多
              </el-button>
              <el-button size="large" @click="openOfficialDocs">
                官方文档
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

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-content">
          <div class="footer-links">
            <a href="https://gitee.com/woshinibaba438cnmlgb/zboot-backend-java" target="_blank" class="footer-link">
              项目地址
            </a>
            <span class="footer-divider">|</span>
            <a href="https://www.baidu.com" target="_blank" class="footer-link">
              官方文档
            </a>
            <span class="footer-divider">|</span>
            <a href="#" @click.prevent="showContactDialog = true" class="footer-link">
              联系我们
            </a>
          </div>
          <div class="footer-copyright">
            <p>© 2024 IceeBoot. All rights reserved.</p>
            <p>
              <a href="https://beian.miit.gov.cn/" target="_blank" class="beian-link">
                京ICP备2024086986号-2
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>

    <!-- 登录对话框 -->
    <LoginDialog v-model="showLoginDialog" @success="handleLoginSuccess" />
    
    <!-- Mock模式提示对话框 -->
    <el-dialog
      v-model="showMockDialog"
      title="系统提示"
      width="500px"
      :close-on-click-modal="false"
      class="mock-dialog"
    >
      <div class="mock-dialog-content">
        <div class="mock-icon">
          <el-icon size="48" color="#E6A23C"><Warning /></el-icon>
        </div>
        <div class="mock-text">
          <h3>当前处于Mock模式</h3>
          <p>系统正在使用模拟数据进行演示，所有数据均为测试数据，不代表真实业务数据。</p>
          <p>如需体验完整功能，请访问我们的 
            <a href="https://gitee.com/woshinibaba438cnmlgb/zboot-backend-java" target="_blank" class="gitee-link">
              Gitee仓库
            </a> 
            获取完整项目代码。
          </p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showMockDialog = false">我知道了</el-button>
          <el-button type="primary" @click="openGitee">访问Gitee</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 联系我们对话框 -->
    <el-dialog
      v-model="showContactDialog"
      title="联系我们"
      width="800px"
      :close-on-click-modal="false"
      class="contact-dialog"
    >
      <div class="contact-dialog-content">
        <div class="contact-intro">
          <h3>多种方式联系我们</h3>
          <p>扫描下方二维码，关注我们的官方账号，获取最新资讯和技术支持</p>
        </div>
        <div class="qr-codes-grid">
          <div class="qr-code-item" v-for="platform in socialPlatforms" :key="platform.name">
            <div class="qr-code-image">
              <img :src="platform.qrCode" :alt="platform.name + '二维码'" />
            </div>
            <div class="platform-info">
              <div class="platform-icon" :style="{ backgroundColor: platform.color }">
                <i :class="platform.icon"></i>
              </div>
              <div class="platform-details">
                <h4>{{ platform.name }}</h4>
                <p>{{ platform.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showContactDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
  Platform, // eslint-disable-line
  Warning // eslint-disable-line
} from '@element-plus/icons-vue'
import { isDark, toggleTheme } from '@/utils/theme'
import LoginDialog from '../../components/common/LoginDialog.vue'
import { useUserStore } from '@/stores/user'
import { isMockEnabled } from '@/config/mock'

const router = useRouter()
const userStore = useUserStore()

// 登录对话框状态
const showLoginDialog = ref(false)

// 用户登录状态
const isLoggedIn = computed(() => !!userStore.getToken())

// Mock模式提示弹窗状态
const showMockDialog = ref(false)

// 联系我们弹窗状态
const showContactDialog = ref(false)

// 社交平台数据
const socialPlatforms = [
  {
    name: '哔哩哔哩',
    description: '关注我们的B站账号',
    icon: 'fab fa-bilibili',
    color: '#00A1D6',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzAwQTFENiIvPjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWTlOWTqeWTlDwvdGV4dD48L3N2Zz4='
  },
  {
    name: '抖音',
    description: '关注我们的抖音账号',
    icon: 'fab fa-tiktok',
    color: '#FE2C55',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0ZFMkM1NSIvPjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaKlumdojwvdGV4dD48L3N2Zz4='
  },
  {
    name: '小红书',
    description: '关注我们的小红书账号',
    icon: 'fas fa-book',
    color: '#FF2442',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI0ZGMjQ0MiIvPjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWwj+e6ouS5pjwvdGV4dD48L3N2Zz4='
  },
  {
    name: '微信',
    description: '添加我们的微信',
    icon: 'fab fa-weixin',
    color: '#07C160',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzA3QzE2MCIvPjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuW+ruS/oDwvdGV4dD48L3N2Zz4='
  },
  {
    name: 'QQ',
    description: '添加我们的QQ',
    icon: 'fab fa-qq',
    color: '#12B7F5',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzEyQjdGNSIvPjx0ZXh0IHg9Ijc1IiB5PSI3NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPFFRPC90ZXh0Pjwvc3ZnPg=='
  },
  {
    name: '微信群',
    description: '加入我们的微信群',
    icon: 'fas fa-users',
    color: '#07C160',
    qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iIzA3QzE2MCIvPjx0ZXh0IHg9Ijc1IiB5PSI2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuW+ruS/oeS6pDwvdGV4dD48dGV4dCB4PSI3NSIgeT0iODUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7kuqTmtYE8L3RleHQ+PC9zdmc+'
  }
]

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

// 处理立即体验按钮点击
const handleExperience = () => {
  window.open('https://gitee.com/woshinibaba438cnmlgb/zboot-backend-java', '_blank')
}

// 打开官方文档
const openOfficialDocs = () => {
  window.open('https://www.baidu.com', '_blank')
}

// 打开Gitee
const openGitee = () => {
  window.open('https://gitee.com/woshinibaba438cnmlgb/zboot-backend-java', '_blank')
  showMockDialog.value = false
}

// 检查Mock模式并显示提示
const checkMockMode = () => {
  if (isMockEnabled()) {
    // 延迟显示，让页面先加载完成
    setTimeout(() => {
      showMockDialog.value = true
    }, 2000)
  }
}

// 组件挂载时检查Mock模式
onMounted(() => {
  checkMockMode()
})
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

// 页脚样式
.footer {
  background: var(--bg-color);
  border-top: 1px solid var(--border-lighter);
  padding: 40px 0 20px;
  margin-top: 80px;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.footer-content {
  text-align: center;
}

.footer-links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.footer-link {
  color: var(--text-regular);
  text-decoration: none;
  font-size: 14px;
  transition: color var(--transition-duration);

  &:hover {
    color: var(--primary-color);
  }
}

.footer-divider {
  color: var(--text-disabled);
  font-size: 12px;
}

.footer-copyright {
  color: var(--text-secondary);
  font-size: 12px;
  line-height: 1.6;

  p {
    margin: 4px 0;
  }
}

.beian-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-duration);

  &:hover {
    color: var(--primary-color);
  }
}

// Mock对话框样式
.mock-dialog {
  .el-dialog__header {
    text-align: center;
    padding-bottom: 10px;
  }

  .el-dialog__body {
    padding: 20px 30px;
  }
}

.mock-dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.mock-icon {
  margin-bottom: 20px;
}

.mock-text {
  h3 {
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  p {
    color: var(--text-regular);
    line-height: 1.6;
    margin-bottom: 12px;
    font-size: 14px;
  }
}

.gitee-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color var(--transition-duration);

  &:hover {
    color: var(--primary-light);
    text-decoration: underline;
  }
}

.dialog-footer {
    display: flex;
    justify-content: center;
    gap: 16px;
  }

  // 联系我们对话框样式
  .contact-dialog {
    .el-dialog__header {
      text-align: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-lighter);
    }

    .el-dialog__body {
      padding: 30px;
    }
  }

  .contact-dialog-content {
    .contact-intro {
      text-align: center;
      margin-bottom: 30px;

      h3 {
        color: var(--text-primary);
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      p {
        color: var(--text-regular);
        font-size: 14px;
        line-height: 1.6;
      }
    }
  }

  .qr-codes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    max-height: 400px;
    overflow-y: auto;
    padding: 10px;
  }

  .qr-code-item {
    background: var(--bg-color);
    border: 1px solid var(--border-lighter);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    transition: all 0.3s ease;
    position: relative;
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
      transform: translateY(-5px);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color);

      &::before {
        left: 100%;
      }

      .qr-code-image img {
        transform: scale(1.05);
      }

      .platform-icon {
        transform: scale(1.1) rotate(5deg);
      }
    }
  }

  .qr-code-image {
    margin-bottom: 15px;

    img {
      width: 120px;
      height: 120px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
    }
  }

  .platform-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
  }

  .platform-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .platform-details {
    text-align: left;

    h4 {
      color: var(--text-primary);
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    p {
      color: var(--text-regular);
      font-size: 12px;
      margin: 0;
      line-height: 1.4;
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
    flex-wrap: wrap;
  }

  .features-grid,
  .tech-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 2rem;
  }

  .footer-links {
    flex-direction: column;
    gap: 8px;

    .footer-divider {
      display: none;
    }
  }

  .mock-dialog {
      .el-dialog {
        width: 90% !important;
        margin: 0 auto;
      }
    }

    .contact-dialog {
      .el-dialog {
        width: 95% !important;
        margin: 0 auto;
      }

      .el-dialog__body {
        padding: 20px 15px;
      }
    }

    .qr-codes-grid {
      grid-template-columns: 1fr;
      gap: 15px;
      max-height: 350px;
      padding: 5px;
    }

    .qr-code-item {
      padding: 15px;

      .qr-code-image img {
        width: 100px;
        height: 100px;
      }

      .platform-info {
        gap: 8px;
      }

      .platform-icon {
        width: 35px;
        height: 35px;
        font-size: 16px;
      }

      .platform-details {
        h4 {
          font-size: 14px;
        }

        p {
          font-size: 11px;
        }
      }
    }
  }
</style>
