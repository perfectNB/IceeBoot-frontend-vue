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
        permissions: ['system:user:view']
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
        permissions: ['system:role:view']
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
        permissions: ['system:permission:view']
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
        permissions: ['system:menu:view']
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
        permissions: ['system:file:view']
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
        permissions: ['monitor:redis:view']
      },
      {
        id: 11,
        title: '接口文档',
        name: 'ApiDoc',
        path: '/admin/monitor/api-doc',
        component: 'ApiDocumentation',
        icon: 'Document',
        parentId: 3,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: ['monitor:api-doc']
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
        permissions: ['monitor:task:view']
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
        permissions: ['monitor:log:view']
      }
    ]
  },
  {
    id: 4, title: '智能体控制台', name: 'AgentConsoleRoot', path: '/admin/agent-console', icon: 'Cpu',
    type: 'menu', sort: 4, requiresAuth: true, permissions: ['ai:agent:read'],
    children: [
      {
        id: 100, title: '智能体', name: 'HarnessAgents', path: '/admin/agent-console/agents',
        component: 'HarnessAgents', icon: 'Cpu', parentId: 4, type: 'menu', sort: 1,
        requiresAuth: true, permissions: ['ai:agent:read'],
      },
      {
        id: 101, title: '模型连接', name: 'ModelConnections', path: '/admin/agent-console/models',
        component: 'ModelConnections', icon: 'Cpu', parentId: 4, type: 'menu', sort: 2,
        requiresAuth: true, permissions: ['ai:model:read'],
      },
      {
        id: 102, title: '技能', name: 'AgentSkills', path: '/admin/agent-console/skills',
        component: 'CapabilityManagement', icon: 'Cpu', parentId: 4, type: 'menu', sort: 3,
        requiresAuth: true, permissions: ['ai:capability:read'],
      },
      {
        id: 103, title: '工具', name: 'AgentTools', path: '/admin/agent-console/tools',
        component: 'CapabilityManagement', icon: 'Cpu', parentId: 4, type: 'menu', sort: 4,
        requiresAuth: true, permissions: ['ai:capability:read'],
      },
      {
        id: 104, title: 'MCP 服务', name: 'AgentMcps', path: '/admin/agent-console/mcps',
        component: 'CapabilityManagement', icon: 'Cpu', parentId: 4, type: 'menu', sort: 5,
        requiresAuth: true, permissions: ['ai:capability:read'],
      },
      {
        id: 105, title: '知识库连接', name: 'AgentKnowledge', path: '/admin/agent-console/knowledge',
        component: 'CapabilityManagement', icon: 'Cpu', parentId: 4, type: 'menu', sort: 6,
        requiresAuth: true, permissions: ['ai:capability:read'],
      },
      {
        id: 106, title: '沙箱模板', name: 'AgentSandboxes', path: '/admin/agent-console/sandboxes',
        component: 'CapabilityManagement', icon: 'Cpu', parentId: 4, type: 'menu', sort: 7,
        requiresAuth: true, permissions: ['ai:capability:read'],
      },
      {
        id: 107, title: '执行记录', name: 'AgentRuns', path: '/admin/agent-console/runs',
        component: 'AgentRuns', icon: 'Cpu', parentId: 4, type: 'menu', sort: 8,
        requiresAuth: true, permissions: ['ai:run:read'],
      },
      {
        id: 108, title: '通用画像', name: 'AgentMemory', path: '/admin/agent-console/memory',
        component: 'AgentMemory', icon: 'Notebook', parentId: 4, type: 'menu', sort: 9,
        requiresAuth: true, permissions: ['ai:memory:user-list:api', 'ai:memory:platform-policy-read:api'],
      },
    ],
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
        permissions: ['third:oss:view']
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
        permissions: ['third:email:view']
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
        permissions: ['third:sms:view']
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
        permissions: ['pay:config:view']
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
        permissions: ['pay:record:view']
      }
    ]
  },
  {
    id: 30,
    title: '工作流管理',
    name: 'WorkflowManagement',
    path: '/admin/workflow',
    icon: 'Connection',
    type: 'menu',
    sort: 7,
    requiresAuth: true,
    permissions: [],
    children: [
      {
        id: 31,
        title: '流程定义',
        name: 'WorkflowDefinitions',
        path: '/admin/workflow/definition',
        component: 'WorkflowDefinitions',
        icon: 'List',
        parentId: 30,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: ['workflow:definition']
      },
      {
        id: 32,
        title: 'BPMN设计',
        name: 'BPMNDesign',
        path: '/admin/workflow/design',
        component: 'BPMNDesign',
        icon: 'Edit',
        parentId: 30,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: ['workflow:design']
      },
      {
        id: 33,
        title: '流程图展示',
        name: 'WorkflowDiagram',
        path: '/admin/workflow/diagram',
        component: 'WorkflowDiagram',
        icon: 'Picture',
        parentId: 30,
        type: 'menu',
        sort: 3,
        requiresAuth: true,
        permissions: ['workflow:diagram']
      },
      {
        id: 34,
        title: '流程实例',
        name: 'WorkflowInstances',
        path: '/admin/workflow/instance',
        component: 'WorkflowInstances',
        icon: 'Files',
        parentId: 30,
        type: 'menu',
        sort: 4,
        requiresAuth: true,
        permissions: ['workflow:instance']
      },
      {
        id: 35,
        title: '任务处理',
        name: 'WorkflowTasks',
        path: '/admin/workflow/task',
        component: 'WorkflowTasks',
        icon: 'Checked',
        parentId: 30,
        type: 'menu',
        sort: 5,
        requiresAuth: true,
        permissions: ['workflow:task']
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
        component: 'FrontendCodegen',
        icon: 'Monitor',
        parentId: 5,
        type: 'menu',
        sort: 1,
        requiresAuth: true,
        permissions: ['codegen:frontend:view']
      },
      {
        id: 18,
        title: '后端增删改查',
        name: 'BackendCrud',
        path: '/admin/codegen/backend',
        component: 'BackendCodegen',
        icon: 'Setting',
        parentId: 5,
        type: 'menu',
        sort: 2,
        requiresAuth: true,
        permissions: ['codegen:backend:view']
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
        permissions: ['codegen:test:view']
      }
    ]
  }
]
