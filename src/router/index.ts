import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import type { MenuItem } from '@/types'
import { setSEO, getSEOConfigByPath, getFullUrl } from '@/utils/seo'
import { t } from '@/locales/useAppI18n'

// 导入布局组件
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

// 导入页面组件
const HomePage = () => import('@/pages/home/HomePage.vue')

// 自动导入 pages 目录下所有 vue 文件
const modules = import.meta.glob('../pages/**/*.vue')




function getComponentLoader(componentName: string) {
  // 1. 检查别名映射
  const targetName =  componentName

  const pathKeys = Object.keys(modules)

  // 2. 优先尝试匹配文件名 (兼容旧的 PascalCase 命名，如 UserManagement)
  // 这是最精准的匹配方式，可以避免 "User" 匹配到 "UserDetail" 的问题
  for (const key of pathKeys) {
    const fileName = key.split('/').pop()?.replace(/\.\w+$/, '')
    if (fileName === targetName) {
      return modules[key]
    }
  }

  // 3. 如果文件名没匹配上，且 targetName 包含 /，尝试作为路径后缀匹配
  // 比如 targetName 是 "admin/system/UserManagement"
  if (targetName.includes('/')) {
    for (const key of pathKeys) {
      // 移除 .vue 后缀后比较
      // key: ../pages/admin/system/User.vue -> ../pages/admin/system/User
      const keyWithoutExt = key.replace(/\.\w+$/, '')
      if (keyWithoutExt.endsWith(targetName)) {
        return modules[key]
      }
    }
  }

  console.warn(`未找到组件: ${componentName} (尝试查找: ${targetName})`)
  return null
}

// 将菜单数据转换为路由配置
function menuToRoute(menu: MenuItem, parentPath = ''): RouteRecordRaw {
  let fullPath = menu.path
  if (!fullPath.startsWith('/')) {
    fullPath = parentPath ? `${parentPath}/${menu.path}`.replace(/\/+/g, '/') : `/${menu.path}`
  }

  let routePath = fullPath
  if (parentPath && fullPath.startsWith(parentPath)) {
    routePath = fullPath.slice(parentPath.length).replace(/^\/+/, '')
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
  } else if (menu.component) {
    // 设置组件
    const loader = getComponentLoader(menu.component)
    if (loader) {
      route.component = loader as RouteRecordRaw['component']
    }
  }

  // 处理子菜单
  if (menu.children && menu.children.length > 0) {
    route.children = menu.children.map(child => menuToRoute(child, fullPath))

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
let firstMenuPath: string | null = null

// 重置动态路由状态（用于登出时清理）
export function resetDynamicRoutes(): void {
  dynamicRoutesLoaded = false
  firstMenuPath = null
}

function normalizeMenuPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function resolveFirstMenuPath(menus: MenuItem[]): string | null {
  for (const menu of menus) {
    if (menu.type === 'link') {
      continue
    }
    if (menu.children && menu.children.length > 0) {
      const childPath = resolveFirstMenuPath(menu.children)
      if (childPath) {
        return childPath
      }
    }
    if (menu.path) {
      return normalizeMenuPath(menu.path)
    }
  }
  return null
}

// 生成动态路由并添加到路由器
async function loadDynamicRoutes(): Promise<void> {

  if (dynamicRoutesLoaded) return

  try {
    const userStore = useUserStore()
    let menus = userStore.user?.menus
    if (!menus || menus.length === 0) {
      const userInfo = await userStore.getUserInfo()
      menus = userInfo.menus || []
    }
    firstMenuPath = resolveFirstMenuPath(menus)

    const getRootPath = (path: string): string => {
      const normalized = normalizeMenuPath(path).replace(/^\/+/, '')
      const segment = normalized.split('/')[0] || ''
      return segment ? `/${segment}` : '/'
    }

    const ensureCommonRoutes = (layoutName: string) => {
      const profileName = `${layoutName}-profile-center`
      if (!router.getRoutes().some(route => route.name === profileName)) {
        router.addRoute(layoutName, {
          path: 'profile-center',
          name: profileName,
          component: () => import('@/pages/self/ProfileCenter.vue'),
          meta: {
            title: 'router.profileCenter',
            requiresAuth: true,
            hideInMenu: true
          }
        })
      }

      const messageName = `${layoutName}-message-center`
      if (!router.getRoutes().some(route => route.name === messageName)) {
        router.addRoute(layoutName, {
          path: 'message-center',
          name: messageName,
          component: () => import('@/pages/self/MessageCenter.vue'),
          meta: {
            title: 'router.messageCenter',
            requiresAuth: true,
            hideInMenu: true
          }
        })
      }
    }

    const ensureLayoutRoute = (rootPath: string): string | null => {
      if (rootPath === '/') {
        return null
      }
      const existing = router.getRoutes().find(route => route.path === rootPath)
      if (existing?.name) {
        const existingName = String(existing.name)
        ensureCommonRoutes(existingName)
        return existingName
      }
      const segment = rootPath.replace(/^\/+/, '')
      const layoutName = `layout-${segment}`
      router.addRoute({
        path: rootPath,
        name: layoutName,
        component: AdminLayout,
        meta: {
          title: segment,
          requiresAuth: true,
          layout: true
        }
      })
      ensureCommonRoutes(layoutName)
      return layoutName
    }

    menus.forEach(menu => {
      const fullPath = normalizeMenuPath(menu.path)
      const rootPath = getRootPath(fullPath)
      const layoutName = ensureLayoutRoute(rootPath)
      if (!layoutName) {
        router.addRoute(menuToRoute(menu))
        return
      }
      if (fullPath === rootPath && menu.children && menu.children.length > 0) {
        menu.children.forEach(child => {
          router.addRoute(layoutName, menuToRoute(child, rootPath))
        })
      } else {
        router.addRoute(layoutName, menuToRoute(menu, rootPath))
      }
    })

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
      title: 'router.home',
      requiresAuth: false
    }
  },

  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/pages/error/NotFound.vue'),
    meta: {
      title: 'router.notFound',
      requiresAuth: false,
      hideInMenu: true
    }
  }
]

// 初始路由（仅包含基础路由）
const routes: RouteRecordRaw[] = [
  ...baseRoutes
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

  if (to.path.startsWith('/error=')) {
    const errorMessage = decodeURIComponent(to.path.slice('/error='.length))
    next({ path: '/', query: { error: errorMessage } })
    return
  }

  // 设置页面标题
  if (to.meta.title) {
    const title = typeof to.meta.title === 'string' && to.meta.title.includes('.')
      ? t(to.meta.title)
      : to.meta.title
    document.title = `${title} - IceeBoot Admin`
  }


  const token = userStore.getToken()
  if (!token && to.path !== '/') {
    next('/')
    return
  }

  if (token) {
    try {
      const wasLoaded = dynamicRoutesLoaded
      await loadDynamicRoutes()
      if (!wasLoaded) {
        next({ ...to, replace: true })
        return
      }
    } catch (error) {
      console.error('加载动态路由失败:', error)
      ElMessage.error(t('router.loadFailed'))
      next('/')
      return
    }
  }

  if (token && to.path === '/') {
    if (!firstMenuPath && userStore.user?.menus) {
      firstMenuPath = resolveFirstMenuPath(userStore.user.menus)
    }
    if (firstMenuPath) {
      next(firstMenuPath)
      return
    }
    next('/404')
    return
  }

  if (to.matched.length === 0) {
    next('/404')
    return
  }
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!token) {
      ElMessage.warning(t('router.loginFirst'))
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
    if (to.meta.permissions && Array.isArray(to.meta.permissions) && to.meta.permissions.length > 0) {
      const hasPermission = to.meta.permissions.some(permission =>
        userStore.hasPermission(permission)
      )

      if (!hasPermission) {
        ElMessage.error(t('router.noPermission'))
        if (firstMenuPath) {
          next(firstMenuPath)
        } else {
          next('/')
        }
        return
      }
    }
  }

  next()
})

// SEO处理 - 仅对主页进行SEO优化
router.afterEach((to) => {
  // 只对主页进行SEO处理，其他页面不被搜索引擎收录
  if (to.path === '/') {
    const seoConfig = getSEOConfigByPath(to.path)
    const fullUrl = getFullUrl(to.path)

    setSEO({
      ...seoConfig,
      canonical: fullUrl,
      og: {
        ...seoConfig.og,
        url: fullUrl
      }
    })
  } else {
    // 其他页面设置为不被搜索引擎收录
    setSEO({
      robots: 'noindex,nofollow'
    })
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  ElMessage.error(t('router.routeError'))
})

export default router

// 导出路由类型和工具函数
export type { RouteRecordRaw }
export { loadDynamicRoutes }
