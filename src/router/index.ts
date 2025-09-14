import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { MenuItem } from '@/types'
import { getUserMenus } from '@/api/menu'

// 导入布局组件
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

// 导入页面组件
const HomePage = () => import('@/pages/home/HomePage.vue')

// 组件映射表 - 根据组件名称动态导入组件
const componentMap: Record<string, () => Promise<{ default: unknown }>> = {
  Dashboard: () => import('@/pages/admin/AdminDashboard.vue'),
  UserManagement: () => import('@/pages/admin/system/UserManagement.vue'),
  RoleManagement: () => import('@/pages/admin/system/RoleManagement.vue'),
  PermissionManagement: () => import('@/pages/admin/system/PermissionManagement.vue'),
  MenuManagement: () => import('@/pages/admin/system/MenuManagement.vue'),
  EmailManagement: () => import('@/pages/admin/system/EmailManagement.vue'),
  FileManagement: () => import('@/pages/admin/system/FileManagement.vue'),
  SmsManagement: () => import('@/pages/admin/system/SmsManagement.vue'),
  RedisManagement: () => import('@/pages/admin/monitor/RedisManagement.vue'),
  TaskManagement: () => import('@/pages/admin/monitor/TaskManagement.vue'),
  LogManagement: () => import('@/pages/admin/monitor/LogManagement.vue'),
  ApiDocumentation: () => import('@/pages/admin/monitor/ApiDocumentation.vue'),
  LLMManagement: () => import('@/pages/admin/ai/LLMManagement.vue'),
  AgentManagement: () => import('@/pages/admin/ai/AgentManagement.vue'),
  ChatInterface: () => import('@/pages/admin/ai/ChatInterface.vue'),
  FrontendCodegen: () => import('@/pages/admin/codegen/FrontendCodegen.vue'),
  BackendCodegen: () => import('@/pages/admin/codegen/BackendCodegen.vue'),
  FrontendCrud: () => import('@/pages/admin/codegen/FrontendCodegen.vue'),
  BackendCrud: () => import('@/pages/admin/codegen/BackendCodegen.vue'),
  AIChat: () => import('@/pages/admin/ai/ChatInterface.vue'),
  ApiDoc: () => import('@/pages/admin/monitor/ApiDocumentation.vue'),
  ScheduledTask: () => import('@/pages/admin/monitor/TaskManagement.vue'),
  OSS: () => import('@/pages/admin/third/OSS.vue'),
  Email: () => import('@/pages/admin/third/Email.vue'),
  SMS: () => import('@/pages/admin/third/SMS.vue'),
  ProfileCenter: () => import('@/pages/self/ProfileCenter.vue'),
  MessageCenter: () => import('@/pages/self/MessageCenter.vue'),
}

// 将菜单数据转换为路由配置
function menuToRoute(menu: MenuItem, isChild = false): RouteRecordRaw {
  // 处理路径：如果是子菜单，需要提取相对路径
  let routePath = menu.path
  if (isChild && menu.path.startsWith('/admin/')) {
    // 对于子菜单，提取最后一段作为相对路径
    const pathParts = menu.path.split('/')
    routePath = pathParts[pathParts.length - 1]
  } else if (!isChild) {
    // 对于顶级菜单，移除 /admin/ 前缀
    routePath = menu.path.replace('/admin/', '')
  }

  const route: Partial<RouteRecordRaw> = {
    path: routePath,
    name: menu.name,
    meta: {
      title: menu.title,
      icon: menu.icon,
      requiresAuth: menu.requiresAuth ?? true,
      permissions: menu.permissions,
      // hidden: menu.hidden
    }
  }

  // 如果是外部链接，不设置组件
  if (menu.type === 'link') {
    route.meta!.link = menu.link
  } else if (menu.component && componentMap[menu.component]) {
    // 设置组件
    route.component = componentMap[menu.component]
  }

  // 处理子菜单
  if (menu.children && menu.children.length > 0) {
    route.children = menu.children.map(child => menuToRoute(child, true))

    // 如果有子菜单但没有组件，设置重定向到第一个子菜单
    if (!route.component && route.children.length > 0) {
      const firstChild = route.children[0]
      if (firstChild.path) {
        route.redirect = firstChild.path
      }
    }
  }

  return route as RouteRecordRaw
}

// 动态路由是否已加载
let dynamicRoutesLoaded = false

// 重置动态路由状态（用于登出时清理）
export function resetDynamicRoutes(): void {
  dynamicRoutesLoaded = false
}

// 生成动态路由并添加到路由器
async function loadDynamicRoutes(): Promise<void> {

  if (dynamicRoutesLoaded) return

  try {
    const menus = await getUserMenus()
    const dynamicRoutes = menus.map(menu => menuToRoute(menu))

    // 找到admin路由并添加子路由
    const adminRoute = router.getRoutes().find(route => route.path === '/admin')
    if (adminRoute) {
      // 只清空动态路由，保留静态路由（如个人中心、消息中心）
      const staticRouteNames = ['ProfileCenter', 'MessageCenter'] // 需要保留的静态路由名称
      adminRoute.children?.forEach(child => {
        if (child.name && !staticRouteNames.includes(child.name as string)) {
          router.removeRoute(child.name)
        }
      })

      // 添加动态路由
      dynamicRoutes.forEach(route => {
        router.addRoute('admin', route)
      })

      // 设置默认重定向到第一个菜单
      if (dynamicRoutes.length > 0) {
        const firstRoute = dynamicRoutes[0]
        router.addRoute('admin', {
          path: '',
          redirect: firstRoute.path.startsWith('/') ? `/admin${firstRoute.path}` : `/admin/${firstRoute.path}`
        })
      }
    }

    dynamicRoutesLoaded = true
  } catch (error) {
    console.error('加载动态路由失败:', error)
  }
}

// 基础路由（不需要动态生成的路由）
const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: {
      title: '首页',
      requiresAuth: false
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/pages/error/NotFound.vue'),
    meta: {
      title: '页面不存在',
      requiresAuth: false,
      hideInMenu: true
    }
  }
]

// 初始路由（包含基础路由和空的admin路由）
const routes: RouteRecordRaw[] = [
  ...baseRoutes,
  {
    path: '/admin',
    name: 'admin',
    component: AdminLayout,
    meta: {
      title: '管理后台',
      requiresAuth: true
    },
    children: [
      {
        path: 'profile-center',
        name: 'ProfileCenter',
        component: () => import('@/pages/self/ProfileCenter.vue'),
        meta: {
          title: '个人中心',
          requiresAuth: true,
          hideInMenu: true
        }
      },
      {
        path: 'message-center',
        name: 'MessageCenter',
        component: () => import('@/pages/self/MessageCenter.vue'),
        meta: {
          title: '消息中心',
          requiresAuth: true,
          hideInMenu: true
        }
      }
    ]
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - ZBoot Admin`
  }

  // 获取token（会从localStorage恢复）
  const token = userStore.getToken()
  if (to.path != '/'&&!token ) {
    next('/')
    return
  }
  // 登录后访问首页强制跳转到管理后台
  if (token && to.path === '/') {
    next('/admin')
    return
  }

  // 如果是访问admin路径且有token，优先加载动态路由
  if (to.path.startsWith('/') && token) {
    try {
      const wasLoaded = dynamicRoutesLoaded
      await loadDynamicRoutes()

      // 如果动态路由刚刚加载完成，需要重新导航到目标路由
      if (!wasLoaded) {
        next({ ...to, replace: true })
        return
      }
    } catch (error) {
      console.error('加载动态路由失败:', error)
      ElMessage.error('加载页面失败')
      next('/')
      return
    }
  }

  // // 如果访问admin路径但没有token，跳转到首页
  // if (to.path.startsWith('/admin') && !token) {
  //   ElMessage.warning('请先登录')
  //   next('/')
  //   return
  // }

  if (Object.keys(to.meta).length === 0){


    next('/404')
  }
  if(to.fullPath=='/admin'){
    next('/admin/dashboard')
  }
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!token) {
      ElMessage.warning('请先登录')
      next('/')
      return
    }

    // 如果有token但没有用户信息，尝试获取用户信息
    if (token && !userStore.user) {
      try {
        await userStore.getUserInfo()
      } catch (error) {
        console.error('获取用户信息失败:', error)
        // 如果获取用户信息失败，清除token并跳转到首页
        // userStore.clearToken()
        // userStore.clearUser()
        // ElMessage.error('登录状态已过期，请重新登录')
        next('/')
        return
      }
    }

    // 检查权限
    if (to.meta.permissions && Array.isArray(to.meta.permissions)) {
      const hasPermission = to.meta.permissions.some(permission =>
        userStore.hasPermission(permission)
      )

      if (!hasPermission) {
        ElMessage.error('您没有访问该页面的权限')
        next('/')
        return
      }
    }
  }

  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  ElMessage.error('页面加载失败')
})

export default router

// 导出路由类型和工具函数
export type { RouteRecordRaw }
export { loadDynamicRoutes }
