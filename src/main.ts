import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Element Plus - 优化加载
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
// 主题样式在首屏前加载，避免深色页面混入亮色组件。
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

// 应用组件和路由
import App from './App.vue'
import router from './router'

// 国际化
import i18n, { setLocale } from './locales'

// 全局样式
import './assets/base.css'
import './styles/index.scss'

// 主题初始化
import { initTheme, watchSystemTheme } from './utils/theme'

// 控制台防护
import consoleProtection from './utils/console-protection'

// 性能监控
import { initPerformanceMonitoring } from './utils/performance'

// SEO初始化
import { initSEO } from './utils/seo'
import { setupPWA } from './pwa'
import { setupVersionGuard } from './versionGuard'

const app = createApp(App)

// 初始化主题
initTheme()
const stopSystemTheme = watchSystemTheme()
if (import.meta.hot) import.meta.hot.dispose(stopSystemTheme)

// 启动控制台防护
consoleProtection.start()

// 初始化SEO配置
initSEO()

if (import.meta.env.PROD) {
  setupPWA()
}

setupVersionGuard()

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus)

// Restore the explicit preference before mounting to avoid a language flash.
const savedLocale = localStorage.getItem('app-locale')
const defaultLocale = navigator.language.startsWith('zh') ? 'zh-CN' : 'en'
setLocale(savedLocale === 'en' || savedLocale === 'zh-CN' ? savedLocale : defaultLocale)

// 挂载应用
app.mount('#app')

// 初始化应用状态
// initApp()

// 初始化性能监控
if (import.meta.env.PROD) {
  initPerformanceMonitoring()
}
