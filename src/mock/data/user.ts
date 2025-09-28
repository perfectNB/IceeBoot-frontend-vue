/**
 * 用户相关Mock数据
 */

import type { User } from '@/types'

// 用户Mock数据
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'admin@iceeboot.com',
    phone: '13800138000',
    roles: ['admin'],
    permissions: [
      'system:role:edit', 'ai:agent:create', 'system:role:all:api', 'ai:agent:list:api', 'third:oss:validate:api', 'ai:agent:view', 'system:role:permission:view', 'system:menu:check:api', 'system:role:menus:api', 'system:menu:user:api', 'monitor:redis:query:api', 'third:oss:list:api', 'system:permission:tree:api', 'monitor:redis:create:api', 'third:sms:delete', 'third:sms:detail:api', 'third:oss:view', 'ai:llm:delete:api', 'system:user:reset:password', 'system:file:view', 'third:oss:delete:api', 'monitor:task:create:api', 'third:oss:edit', 'system:file:upload', 'system:permission:create:api', 'ai:llm', 'system:menu:delete:api', 'third:oss:batch:api', 'third:oss:create', 'system:menu:create', 'third:oss:stats:api', 'system:menu', 'system:bucket:delete', 'system:user:delete', 'monitor:redis:detail:api', 'ai:llm:status:api', 'system:permission:view', 'third:oss:create:api', 'third:oss:update:api', 'monitor:task:update:api', 'third:sms:view', 'system:user:delete:api', 'monitor:log:list:api', 'third', 'system:role:list:api', 'third:sms:create:api', 'monitor:log', 'ai:chat:view', 'system:role', 'monitor:task:delete:api', 'ai', 'third:email:validate:api', 'third:email:batch:api', 'monitor:task:detail:api', 'ai:chat', 'ai:llm:update:api', 'monitor:task:update:api', 'third:email:edit', 'system:permission', 'ai:chat:stream:api', 'ai:agent:create:api', 'ai:chat:delete:api', 'third:oss:page:api', 'third:email:create:api', 'monitor:redis:delete', 'system:permission:children:api', 'third:email:detail:api', 'ai:llm:view', 'third:email:available:api', 'monitor:redis', 'system:role:create:api', 'system:role:update:api', 'third:oss:status:api', 'system:permission:edit', 'ai:llm:create', 'third:email:provider:api', 'system:role:view', 'monitor:task:create:api', 'system:user:update:api', 'third:sms:config:api', 'monitor:redis:create', 'ai:agent', 'third:sms:providers:api', 'system:user:create:api', 'system:menu:update:api', 'monitor:api-doc', 'third:oss', 'system:role:permissions:api', 'system:role:delete:api', 'system:permission:create', 'third:email', 'third:sms:update:api', 'third:email:page:api', 'system:permission:detail:api', 'ai:chat:create', 'ai:chat:message:api', 'third:email:providers:api', 'monitor:task:stop', 'monitor:task:stop:api', 'ai:agent:platform:api', 'monitor:log:list:api', 'third:sms:page:api', 'third:sms:edit', 'system:permission:delete:api', 'system:menu:status:api', 'system:user:detail:api', 'system:bucket:create', 'third:sms:validate:api', 'third:oss:config:api', 'monitor:task:create', 'system:menu:delete', 'ai:llm:edit', 'third:email:delete:api', 'third:sms:delete:api', 'monitor:log:view', 'monitor:task', 'monitor:redis:view', 'monitor', 'third:email:delete', 'system:file', 'ai:chat:send', 'ai:llm:list:api', 'monitor:log:delete', 'system:user:create', 'third:oss:provider:api', 'third:email:status:api', 'dashboard:view', 'monitor:log:delete:api', 'ai:chat:create:api', 'ai:agent:delete', 'monitor:task:start', 'ai:llm:create:api', 'ai:agent:type:api', 'monitor:task:delete:api', 'third:oss:providers:api', 'third:email:config:api', 'system:role:delete', 'monitor:log:delete:api', 'monitor:redis:batch-delete:api', 'monitor:task:page:api', 'third:sms', 'system:permission:page:api', 'ai:agent:update:api', 'third:email:list:api', 'system', 'system:bucket:edit', 'third:email:view', 'system:user:edit', 'ai:agent:status:api', 'ai:llm:delete', 'system:menu:edit', 'monitor:task:start:api', 'third:sms:batch:api', 'monitor:redis:list:api', 'system:role:status:api', 'third:email:stats:api', 'monitor:task:list:api', 'system:role:menu:view', 'system:menu:tree:api', 'system:menu:create:api', 'third:sms:status:api', 'system:user:export', 'system:user:view', 'third:sms:provider:api', 'system:role:detail:api', 'system:permission:status:api', 'system:permission:delete', 'monitor:task:delete', 'third:oss:delete', 'ai:llm:batch:api', 'ai:chat:sessions:api', 'ai:agent:delete:api', 'monitor:task:view', 'system:menu:view', 'third:sms:available:api', 'system:permission:update:api', 'system:user', 'third:sms:stats:api', 'ai:llm:stats:api', 'ai:agent:edit', 'third:oss:detail:api', 'monitor:task:edit', 'third:sms:create', 'third:sms:list:api', 'ai:chat:delete', 'third:oss:available:api', 'system:role:create', 'third:email:create', 'system:user:list:api', 'third:email:update:api'
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    username: 'system_admin',
    nickname: '系统管理员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'system@iceeboot.com',
    phone: '13800138001',
    roles: ['system_admin'],
    permissions: [
      'dashboard:view',
      'system',
      'system:user',
      'system:user:view',
      'system:user:create',
      'system:user:edit',
      'system:role',
      'system:role:view',
      'system:permission',
      'system:permission:view',
        'system:menu',
        'system:menu:view',
        'codegen',
        'codegen:frontend',
        'codegen:frontend:view',
        'codegen:frontend:generate',
        'codegen:backend',
        'codegen:backend:view',
        'codegen:backend:generate'
      ],
    status: 'active',
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-02 00:00:00'
  },
  {
    id: 3,
    username: 'user',
    nickname: '普通用户',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'user@iceeboot.com',
    phone: '13800138002',
    roles: ['user'],
    permissions: ['dashboard:view'],
    status: 'active',
    createTime: '2024-01-03 00:00:00',
    updateTime: '2024-01-03 00:00:00'
  },
  {
    id: 4,
    username: 'user_admin',
    nickname: '用户管理员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'useradmin@iceeboot.com',
    phone: '13800138003',
    roles: ['user_admin'],
    permissions: [
      'dashboard:view',
      'system:user',
      'system:user:view',
      'system:user:create',
      'system:user:edit',
      'system:user:delete'
    ],
    status: 'active',
    createTime: '2024-01-04 00:00:00',
    updateTime: '2024-01-04 00:00:00'
  }
]

// 登录相关Mock数据
export const mockLoginUsers = [
  {
    username: 'admin',
    password: '111111',
    user: {
      id: 1,
      username: 'admin',
      nickname: '超级管理员',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      email: 'admin@iceeboot.com',
      roles: ['admin'],
      permissions: [
        'system:role:edit', 'ai:agent:create', 'system:role:all:api', 'ai:agent:list:api', 'third:oss:validate:api', 'ai:agent:view', 'system:role:permission:view', 'system:menu:check:api', 'system:role:menus:api', 'system:menu:user:api', 'monitor:redis:query:api', 'third:oss:list:api', 'system:permission:tree:api', 'monitor:redis:create:api', 'third:sms:delete', 'third:sms:detail:api', 'third:oss:view', 'ai:llm:delete:api', 'system:user:reset:password', 'system:file:view', 'third:oss:delete:api', 'monitor:task:create:api', 'third:oss:edit', 'system:file:upload', 'system:permission:create:api', 'ai:llm', 'system:menu:delete:api', 'third:oss:batch:api', 'third:oss:create', 'system:menu:create', 'third:oss:stats:api', 'system:menu', 'system:bucket:delete', 'system:user:delete', 'monitor:redis:detail:api', 'ai:llm:status:api', 'system:permission:view', 'third:oss:create:api', 'third:oss:update:api', 'monitor:task:update:api', 'third:sms:view', 'system:user:delete:api', 'monitor:log:list:api', 'third', 'system:role:list:api', 'third:sms:create:api', 'monitor:log', 'ai:chat:view', 'system:role', 'monitor:task:delete:api', 'ai', 'third:email:validate:api', 'third:email:batch:api', 'monitor:task:detail:api', 'ai:chat', 'ai:llm:update:api', 'monitor:task:update:api', 'third:email:edit', 'system:permission', 'ai:chat:stream:api', 'ai:agent:create:api', 'ai:chat:delete:api', 'third:oss:page:api', 'third:email:create:api', 'monitor:redis:delete', 'system:permission:children:api', 'third:email:detail:api', 'ai:llm:view', 'third:email:available:api', 'monitor:redis', 'system:role:create:api', 'system:role:update:api', 'third:oss:status:api', 'system:permission:edit', 'ai:llm:create', 'third:email:provider:api', 'system:role:view', 'monitor:task:create:api', 'system:user:update:api', 'third:sms:config:api', 'monitor:redis:create', 'ai:agent', 'third:sms:providers:api', 'system:user:create:api', 'system:menu:update:api', 'monitor:api-doc', 'third:oss', 'system:role:permissions:api', 'system:role:delete:api', 'system:permission:create', 'third:email', 'third:sms:update:api', 'third:email:page:api', 'system:permission:detail:api', 'ai:chat:create', 'ai:chat:message:api', 'third:email:providers:api', 'monitor:task:stop', 'monitor:task:stop:api', 'ai:agent:platform:api', 'monitor:log:list:api', 'third:sms:page:api', 'third:sms:edit', 'system:permission:delete:api', 'system:menu:status:api', 'system:user:detail:api', 'system:bucket:create', 'third:sms:validate:api', 'third:oss:config:api', 'monitor:task:create', 'system:menu:delete', 'ai:llm:edit', 'third:email:delete:api', 'third:sms:delete:api', 'monitor:log:view', 'monitor:task', 'monitor:redis:view', 'monitor', 'third:email:delete', 'system:file', 'ai:chat:send', 'ai:llm:list:api', 'monitor:log:delete', 'system:user:create', 'third:oss:provider:api', 'third:email:status:api', 'dashboard:view', 'monitor:log:delete:api', 'ai:chat:create:api', 'ai:agent:delete', 'monitor:task:start', 'ai:llm:create:api', 'ai:agent:type:api', 'monitor:task:delete:api', 'third:oss:providers:api', 'third:email:config:api', 'system:role:delete', 'monitor:log:delete:api', 'monitor:redis:batch-delete:api', 'monitor:task:page:api', 'third:sms', 'system:permission:page:api', 'ai:agent:update:api', 'third:email:list:api', 'system', 'system:bucket:edit', 'third:email:view', 'system:user:edit', 'ai:agent:status:api', 'ai:llm:delete', 'system:menu:edit', 'monitor:task:start:api', 'third:sms:batch:api', 'monitor:redis:list:api', 'system:role:status:api', 'third:email:stats:api', 'monitor:task:list:api', 'system:role:menu:view', 'system:menu:tree:api', 'system:menu:create:api', 'third:sms:status:api', 'system:user:export', 'system:user:view', 'third:sms:provider:api', 'system:role:detail:api', 'system:permission:status:api', 'system:permission:delete', 'monitor:task:delete', 'third:oss:delete', 'ai:llm:batch:api', 'ai:chat:sessions:api', 'ai:agent:delete:api', 'monitor:task:view', 'system:menu:view', 'third:sms:available:api', 'system:permission:update:api', 'system:user', 'third:sms:stats:api', 'ai:llm:stats:api', 'ai:agent:edit', 'third:oss:detail:api', 'monitor:task:edit', 'third:sms:create', 'third:sms:list:api', 'ai:chat:delete', 'third:oss:available:api', 'system:role:create', 'third:email:create', 'system:user:list:api', 'third:email:update:api'
      ]
    }
  },
  {
    username: 'system_admin',
    password: '111111',
    user: {
      id: 2,
      username: 'system_admin',
      nickname: '系统管理员',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      email: 'system@iceeboot.com',
      roles: ['system_admin'],
      permissions: [
        'dashboard:view',
        'system',
        'system:user',
        'system:user:view',
        'system:user:create',
        'system:user:edit',
        'system:role',
        'system:role:view',
        'system:permission',
        'system:permission:view',
        'system:menu',
        'system:menu:view',
        'codegen',
        'codegen:frontend',
        'codegen:frontend:view',
        'codegen:frontend:generate',
        'codegen:backend',
        'codegen:backend:view',
        'codegen:backend:generate'
      ]
    }
  },
  {
    username: 'user',
    password: '111111',
    user: {
      id: 3,
      username: 'user',
      nickname: '普通用户',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      email: 'user@iceeboot.com',
      roles: ['user'],
      permissions: [
        'dashboard:view',
      ]
    }
  },
  {
    username: 'user_admin',
    password: '111111',
    user: {
      id: 4,
      username: 'user_admin',
      nickname: '用户管理员',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      email: 'useradmin@iceeboot.com',
      roles: ['user_admin'],
      permissions: [
        'dashboard:view',
        'system:user',
        'system:user:view',
        'system:user:create',
        'system:user:edit',
        'system:user:delete'
      ]
    }
  }
]
