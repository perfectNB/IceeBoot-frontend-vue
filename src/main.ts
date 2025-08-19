import { createApp } from 'vue'
import { createPinia } from 'pinia'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// 应用组件和路由
import App from './App.vue'
import router from './router'

// 全局样式
import './styles/index.scss'

// 主题初始化
import { initTheme } from './utils/theme'

const app = createApp(App)

// 初始化主题
initTheme()

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
