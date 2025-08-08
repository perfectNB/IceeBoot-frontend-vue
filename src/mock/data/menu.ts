/**
 * 菜单相关Mock数据
 */

import type { MenuItem } from '@/types'

// 菜单Mock数据
export const mockMenus: MenuItem[] = [
  {
    id: 1,
    title: '工作台',
    name: 'Dashboard',
    path: '/admin/dashboard',
    component: 'Dashboard',
    icon: 'DataAnalysis',
    type: 'menu',
    sort: 1,
    requiresAuth: true,
    permissions: ['dashboard:view']
  },
  {
    id: 2,
    title: '系统管理',
    name: 'SystemManagement',
    path: '/admin/system',
    icon: 'Setting',
    type: 'menu',
    sort: 2,
    requiresAuth: true,
    permissions: ['system'],
    children: [
      {
        id: 21,
        title: '用户管理',
        name: 'UserManagement',
        path: '/admin/system/user',
        component: 'UserManagement',
        icon: 'User',
        parentId: 2,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: ['system:user']
      },
      {
        id: 22,
        title: '角色管理',
        name: 'RoleManagement',
        path: '/admin/system/role',
        component: 'RoleManagement',
        icon: 'UserFilled',
        parentId: 2,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: ['system:role']
      },
      {
        id: 23,
        title: '权限管理',
        name: 'PermissionManagement',
        path: '/admin/system/permission',
        component: 'PermissionManagement',
        icon: 'Key',
        parentId: 2,
        type: 'menu',
        sort: 3,
        requiresAuth: true,
        permissions: ['system:permission']
      },
      {
        id: 24,
        title: '菜单管理',
        name: 'MenuManagement',
        path: '/admin/system/menu',
        component: 'MenuManagement',
        icon: 'Menu',
        parentId: 2,
        type: 'menu',
        sort: 4,
        requiresAuth: true,
        permissions: ['system:menu']
      }
    ]
  },
  {
    id: 3,
    title: '系统监控',
    name: 'SystemMonitor',
    path: '/admin/monitor',
    icon: 'Monitor',
    type: 'menu',
    sort: 3,
    requiresAuth: true,
    permissions: ['monitor'],
    children: [
      {
        id: 31,
        title: 'Redis管理',
        name: 'RedisManagement',
        path: '/admin/monitor/redis',
        component: 'RedisManagement',
        icon: 'Coin',
        parentId: 3,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: ['monitor:redis']
      },
      {
        id: 32,
        title: '接口文档',
        name: 'ApiDoc',
        path: '',
        component: 'ApiDoc',
        icon: 'Document',
        parentId: 3,
        type: 'link',
        sort: 2,
        requiresAuth: true,
        permissions: ['monitor:api-doc'],
        link: 'https://www.baidu.com'
      },
      {
        id: 33,
        title: '定时任务',
        name: 'ScheduledTask',
        path: '/admin/monitor/task',
        component: 'ScheduledTask',
        icon: 'Timer',
        parentId: 3,
        type: 'menu',
        sort: 3,
        requiresAuth: true,
        permissions: ['monitor:task']
      },
      {
        id: 34,
        title: '日志管理',
        name: 'LogManagement',
        path: '/admin/monitor/log',
        component: 'LogManagement',
        icon: 'Document',
        parentId: 3,
        type: 'menu',
        sort: 4,
        requiresAuth: true,
        permissions: ['monitor:log']
      }
    ]
  },
  {
    id: 4,
    title: 'AI管理',
    name: 'AIManagement',
    path: '/admin/ai',
    icon: 'Cpu',
    type: 'menu',
    sort: 4,
    requiresAuth: true,
    permissions: ['ai'],
    children: [
      {
        id: 41,
        title: '大模型管理',
        name: 'LLMManagement',
        path: '/admin/ai/llm',
        component: 'LLMManagement',
        icon: 'Cpu',
        parentId: 4,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: ['ai:llm']
      },
      {
        id: 42,
        title: 'Agent管理',
        name: 'AgentManagement',
        path: '/admin/ai/agent',
        component: 'AgentManagement',
        icon: 'Avatar',
        parentId: 4,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: ['ai:agent']
      },
      {
        id: 43,
        title: 'AI对话',
        name: 'AIChat',
        path: '/admin/ai/chat',
        component: 'AIChat',
        icon: 'ChatDotRound',
        parentId: 4,
        type: 'menu',
        sort: 3,
        requiresAuth: true,
        permissions: ['ai:chat']
      }
    ]
  }
]
