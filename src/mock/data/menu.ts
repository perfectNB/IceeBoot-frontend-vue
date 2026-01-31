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
    component: 'AdminDashboard',
    icon: 'DataAnalysis',
    type: 'menu',
    sort: 1,
    requiresAuth: true,
    permissions: []
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
    permissions: [],
    children: [
      {
        id: 6,
        title: '用户管理',
        name: 'UserManagement',
        path: '/admin/system/user',
        component: 'UserManagement',
        icon: 'User',
        parentId: 2,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 7,
        title: '角色管理',
        name: 'RoleManagement',
        path: '/admin/system/role',
        component: 'RoleManagement',
        icon: 'UserFilled',
        parentId: 2,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 8,
        title: '权限管理',
        name: 'PermissionManagement',
        path: '/admin/system/permission',
        component: 'PermissionManagement',
        icon: 'Key',
        parentId: 2,
        type: 'menu',
        sort: 3,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 9,
        title: '菜单管理',
        name: 'MenuManagement',
        path: '/admin/system/menu',
        component: 'MenuManagement',
        icon: 'Menu',
        parentId: 2,
        type: 'menu',
        sort: 4,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 26,
        title: '文件管理',
        name: 'FileManagement',
        path: '/admin/system/file',
        component: 'FileManagement',
        icon: 'Files',
        parentId: 2,
        type: 'menu',
        sort: 5,
        requiresAuth: true,
        permissions: []
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
    permissions: [],
    children: [
      {
        id: 10,
        title: 'Redis管理',
        name: 'RedisManagement',
        path: '/admin/monitor/redis',
        component: 'RedisManagement',
        icon: 'Coin',
        parentId: 3,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 11,
        title: '接口文档',
        name: 'ApiDoc',
        path: '',
        component: 'ApiDocumentation',
        icon: 'Document',
        parentId: 3,
        type: 'link',
        sort: 2,
        requiresAuth: true,
        link: 'http://localhost:9000/iceeboot/api/doc.html#/home',
        permissions: []
      },
      {
        id: 12,
        title: '定时任务',
        name: 'ScheduledTask',
        path: '/admin/monitor/task',
        component: 'TaskManagement',
        icon: 'Timer',
        parentId: 3,
        type: 'menu',
        sort: 3,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 13,
        title: '日志管理',
        name: 'LogManagement',
        path: '/admin/monitor/log',
        component: 'LogManagement',
        icon: 'Document',
        parentId: 3,
        type: 'menu',
        sort: 4,
        requiresAuth: true,
        permissions: []
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
    permissions: [],
    children: [
      {
        id: 14,
        title: '大模型管理',
        name: 'LLMManagement',
        path: '/admin/ai/llm',
        component: 'LLMManagement',
        icon: 'Cpu',
        parentId: 4,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 15,
        title: 'Agent管理',
        name: 'AgentManagement',
        path: '/admin/ai/agent',
        component: 'AgentManagement',
        icon: 'Avatar',
        parentId: 4,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 16,
        title: 'AI对话',
        name: 'AIChat',
        path: '/admin/ai/chat',
        component: 'ChatInterface',
        icon: 'ChatDotRound',
        parentId: 4,
        type: 'menu',
        sort: 3,
        requiresAuth: true,
        permissions: []
      }
    ]
  },
  {
    id: 22,
    title: '三方管理',
    name: 'ThreePartyManagement',
    path: '/admin/third',
    icon: 'Watermelon',
    type: 'menu',
    sort: 5,
    requiresAuth: true,
    permissions: [],
    children: [
      {
        id: 23,
        title: 'OSS管理',
        name: 'OSS',
        path: '/admin/third/oss',
        component: 'OSS',
        icon: 'Cloudy',
        parentId: 22,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 24,
        title: '邮件管理',
        name: 'Email',
        path: '/admin/third/email',
        component: 'Email',
        icon: 'Message',
        parentId: 22,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 25,
        title: '短信管理',
        name: 'SMS',
        path: '/admin/third/sms',
        component: 'SMS',
        icon: 'MessageBox',
        parentId: 22,
        type: 'menu',
        sort: 3,
        requiresAuth: true,
        permissions: []
      }
    ]
  },
  {
    id: 27,
    title: '支付管理',
    name: 'PaymentManagement',
    path: '/admin/pay',
    icon: 'Wallet',
    type: 'menu',
    sort: 6,
    requiresAuth: true,
    permissions: [],
    children: [
      {
        id: 28,
        title: '支付配置',
        name: 'PayConfig',
        path: '/admin/pay/config',
        component: 'PayConfig',
        icon: 'Setting',
        parentId: 27,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 29,
        title: '支付记录',
        name: 'PayRecord',
        path: '/admin/pay/record',
        component: 'PayRecord',
        icon: 'Document',
        parentId: 27,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: []
      }
    ]
  },
  {
    id: 5,
    title: '代码生成',
    name: 'CodeGeneration',
    path: '/admin/codegen',
    icon: 'Document',
    type: 'menu',
    sort: 8,
    requiresAuth: true,
    permissions: [],
    children: [
      {
        id: 17,
        title: '前端增删改查',
        name: 'FrontendCrud',
        path: '/admin/codegen/frontend',
        component: 'FrontendCrud',
        icon: 'Monitor',
        parentId: 5,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 18,
        title: '后端增删改查',
        name: 'BackendCrud',
        path: '/admin/codegen/backend',
        component: 'BackendCrud',
        icon: 'Setting',
        parentId: 5,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: []
      },
      {
        id: 19,
        title: '前端生成测试代码',
        name: 'FrontendTest',
        path: '/admin/codegen/test',
        component: 'FrontendTest',
        icon: 'Setting',
        parentId: 5,
        type: 'menu',
        sort: 3,
        requiresAuth: true,
        permissions: []
      }
    ]
  }
]
