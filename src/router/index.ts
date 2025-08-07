import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 导入布局组件
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

// 导入页面组件
const HomePage = () => import('@/pages/home/HomePage.vue')
const Dashboard = () => import('@/pages/admin/Dashboard.vue')
const UserManagement = () => import('@/pages/admin/system/UserManagement.vue')

// 定义路由
const routes: RouteRecordRaw[] = [
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
    path: '/admin',
    component: AdminLayout,
    meta: {
      title: '管理后台',
      requiresAuth: true
    },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: {
          title: '工作台',
          icon: 'DataAnalysis',
          requiresAuth: true
        }
      },
      {
        path: 'system',
        name: 'SystemManagement',
        // 一级菜单重定向到第一个子菜单，避免404
        redirect: '/admin/system/user',
        meta: {
          title: '系统管理',
          icon: 'Setting',
          requiresAuth: true
        },
        children: [
          {
            path: 'user',
            name: 'UserManagement',
            component: UserManagement,
            meta: {
              title: '用户管理',
              icon: 'User',
              requiresAuth: true,
              permissions: ['system:user:view']
            }
          }
        ]
      }
    ]
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
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
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
  
  // 登录后访问首页强制跳转到管理后台
  // 注释：如需修改登录后的默认跳转页面，请修改下面的 '/admin' 路径
  if (userStore.token && to.path === '/') {
    next('/admin')
    return
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!userStore.token) {
      ElMessage.warning('请先登录')
      next('/')
      return
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

// 导出路由类型
export type { RouteRecordRaw }
