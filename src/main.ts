import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Element Plus - 优化加载
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 延迟加载Element Plus样式
import('element-plus/dist/index.css')
import('element-plus/theme-chalk/dark/css-vars.css')

// 应用组件和路由
import App from './App.vue'
import router from './router'

// 国际化
import i18n, { setLocale } from './locales'

// 全局样式
import './assets/base.css'
import './styles/index.scss'

// 主题初始化
import { initTheme } from './utils/theme'

// 控制台防护
import consoleProtection from './utils/console-protection'

// 性能监控
import { initPerformanceMonitoring } from './utils/performance'

// SEO初始化
import { initSEO } from './utils/seo'

const app = createApp(App)

// 初始化主题
initTheme()

// 启动控制台防护
consoleProtection.start()

// 初始化SEO配置
initSEO()

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus)

// 调试信息（仅开发环境输出）
if (import.meta.env.DEV) {
  const zhCNHome = i18n.global.getLocaleMessage('zh-CN')?.home as Record<string, unknown> | undefined
  console.log('[i18n Debug] Available locales:', i18n.global.availableLocales)
  console.log('[i18n Debug] Current locale:', i18n.global.locale.value)
  console.log('[i18n Debug] home.heroTitle:', zhCNHome?.heroTitle)
  console.log('[i18n Debug] Test translation:', i18n.global.t('home.heroTitle'))
}

// 初始化语言设置（在挂载前从 localStorage 恢复）
if (typeof window !== 'undefined') {
  const savedLocale = localStorage.getItem('app-locale')
  if (import.meta.env.DEV) {
    console.log('[i18n Debug] Saved locale from localStorage:', savedLocale)
  }
  if (savedLocale === 'zh-CN' || savedLocale === 'en') {
    setLocale(savedLocale)
    if (import.meta.env.DEV) {
      console.log('[i18n Debug] Locale set to:', savedLocale)
    }
  } else {
    // 根据浏览器语言设置默认语言
    const browserLang = navigator.language
    if (import.meta.env.DEV) {
      console.log('[i18n Debug] Browser language:', browserLang)
    }
    if (browserLang.startsWith('zh')) {
      setLocale('zh-CN')
      if (import.meta.env.DEV) {
        console.log('[i18n Debug] Locale set to zh-CN based on browser')
      }
    } else {
      setLocale('en')
      if (import.meta.env.DEV) {
        console.log('[i18n Debug] Locale set to en based on browser')
      }
    }
  }
  if (import.meta.env.DEV) {
    console.log('[i18n Debug] Final locale:', i18n.global.locale.value)
  }
}

// 挂载应用
app.mount('#app')

// 初始化应用状态
// initApp()

// 初始化性能监控
if (import.meta.env.PROD) {
  initPerformanceMonitoring()
}
