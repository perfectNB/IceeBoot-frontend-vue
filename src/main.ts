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

// 全局样式
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
app.use(ElementPlus)

// // 应用初始化
// const initApp = async () => {
//   const { useUserStore } = await import('./stores/user')
//   const userStore = useUserStore()
//
//   // 如果有token，尝试恢复用户信息
//   const token = userStore.getToken()
//   if (token && !userStore.user) {
//     try {
//       await userStore.getUserInfo()
//       console.log('用户状态已恢复')
//     } catch (error) {
//       console.warn('恢复用户状态失败，可能token已过期:', error)
//       // 清除无效的token
//       userStore.clearToken()
//       userStore.clearUser()
//     }
//   }
// }

// 挂载应用
app.mount('#app')

// 初始化应用状态
// initApp()

// 初始化性能监控
if (import.meta.env.PROD) {
  initPerformanceMonitoring()
}
