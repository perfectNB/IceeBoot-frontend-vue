import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

// 导入布局组件
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

// 导入页面组件
const HomePage = () => import('@/pages/home/HomePage.vue')
const Dashboard = () => import('@/pages/admin/AdminDashboard.vue')
const UserManagement = () => import('@/pages/admin/system/UserManagement.vue')
const RoleManagement = () => import('@/pages/admin/system/RoleManagement.vue')
const PermissionManagement = () => import('@/pages/admin/system/PermissionManagement.vue')
const MenuManagement = () => import('@/pages/admin/system/MenuManagement.vue')
const RedisManagement = () => import('@/pages/admin/monitor/RedisManagement.vue')
const TaskManagement = () => import('@/pages/admin/monitor/TaskManagement.vue')
const LogManagement = () => import('@/pages/admin/monitor/LogManagement.vue')
const ApiDocumentation = () => import('@/pages/admin/monitor/ApiDocumentation.vue')
const LLMManagement = () => import('@/pages/admin/ai/LLMManagement.vue')
const AgentManagement = () => import('@/pages/admin/ai/AgentManagement.vue')
const ChatInterface = () => import('@/pages/admin/ai/ChatInterface.vue')

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
          requiresAuth: true,
          permissions: ['dashboard:view']
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
          requiresAuth: true,
          permissions: ['system']
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
              permissions: ['system:user']
            }
          },
          {
            path: 'role',
            name: 'RoleManagement',
            component: RoleManagement,
            meta: {
              title: '角色管理',
              icon: 'UserFilled',
              requiresAuth: true,
              permissions: ['system:role']
            }
          },
          {
            path: 'permission',
            name: 'PermissionManagement',
            component: PermissionManagement,
            meta: {
              title: '权限管理',
              icon: 'Lock',
              requiresAuth: true,
              permissions: ['system:permission']
            }
          },
          {
            path: 'menu',
            name: 'MenuManagement',
            component: MenuManagement,
            meta: {
              title: '菜单管理',
              icon: 'Menu',
              requiresAuth: true,
              permissions: ['system:menu']
            }
          }
        ]
      },
      {
        path: 'monitor',
        name: 'MonitorManagement',
        redirect: '/admin/monitor/redis',
        meta: {
          title: '系统监控',
          icon: 'Monitor',
          requiresAuth: true,
          permissions: ['monitor']
        },
        children: [
          {
            path: 'redis',
            name: 'RedisManagement',
            component: RedisManagement,
            meta: {
              title: 'Redis管理',
              icon: 'Database',
              requiresAuth: true,
              permissions: ['monitor:redis']
            }
          },
          {
            path: 'task',
            name: 'TaskManagement',
            component: TaskManagement,
            meta: {
              title: '定时任务',
              icon: 'Timer',
              requiresAuth: true,
              permissions: ['monitor:task']
            }
          },
          {
            path: 'log',
            name: 'LogManagement',
            component: LogManagement,
            meta: {
              title: '日志管理',
              icon: 'Document',
              requiresAuth: true,
              permissions: ['monitor:log']
            }
          },
          {
            path: 'api-doc',
            name: 'ApiDocumentation',
            component: ApiDocumentation,
            meta: {
              title: '接口文档',
              icon: 'Link',
              requiresAuth: true,
              permissions: ['monitor:api-doc']
            }
          }
        ]
      },
      {
        path: 'ai',
        name: 'AIManagement',
        redirect: '/admin/ai/llm',
        meta: {
          title: 'AI管理',
          icon: 'Cpu',
          requiresAuth: true,
          permissions: ['ai']
        },
        children: [
          {
            path: 'llm',
            name: 'LLMManagement',
            component: LLMManagement,
            meta: {
              title: '大模型管理',
              icon: 'MagicStick',
              requiresAuth: true,
              permissions: ['ai:llm']
            }
          },
          {
            path: 'agent',
            name: 'AgentManagement',
            component: AgentManagement,
            meta: {
              title: 'Agent管理',
              icon: 'Avatar',
              requiresAuth: true,
              permissions: ['ai:agent']
            }
          },
          {
            path: 'chat',
            name: 'ChatInterface',
            component: ChatInterface,
            meta: {
              title: 'AI对话',
              icon: 'ChatDotRound',
              requiresAuth: true,
              permissions: ['ai:chat']
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

  // 获取token（会从localStorage恢复）
  const token = userStore.getToken()

  // 登录后访问首页强制跳转到管理后台
  // 注释：如需修改登录后的默认跳转页面，请修改下面的 '/admin' 路径
  if (token && to.path === '/') {
    next('/admin')
    return
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
        userStore.clearToken()
        userStore.clearUser()
        ElMessage.error('登录状态已过期，请重新登录')
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

// 导出路由类型
export type { RouteRecordRaw }
