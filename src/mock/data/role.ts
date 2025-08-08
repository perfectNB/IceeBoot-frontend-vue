/**
 * 角色相关Mock数据
 */

import type { Role } from '@/types'

// 角色Mock数据
export const mockRoles: Role[] = [
  {
    id: 1,
    name: '超级管理员',
    code: 'admin',
    description: '拥有系统所有权限',
    permissions: [
      'dashboard:view',
      'system',
      'system:user',
      'system:user:view',
      'system:user:create',
      'system:user:edit',
      'system:user:delete',
      'system:role',
      'system:role:view',
      'system:role:create',
      'system:role:edit',
      'system:role:delete',
      'system:permission',
      'system:permission:view',
      'system:permission:create',
      'system:permission:edit',
      'system:permission:delete',
      'system:menu',
      'system:menu:view',
      'system:menu:create',
      'system:menu:edit',
      'system:menu:delete',
       // 系统监控权限
       'monitor',
       'monitor:redis',
       'monitor:redis:view',
       'monitor:redis:delete',
       'monitor:redis:query:api',
       'monitor:redis:delete:api',
       'monitor:api-doc',
       'monitor:task',
       'monitor:task:view',
       'monitor:task:create',
       'monitor:task:edit',
       'monitor:task:delete',
       'monitor:task:start',
       'monitor:task:stop',
       'monitor:task:list:api',
       'monitor:task:create:api',
       'monitor:task:update:api',
       'monitor:task:delete:api',
       'monitor:task:start:api',
       'monitor:task:stop:api',
       'monitor:log',
       'monitor:log:view',
       'monitor:log:delete',
       'monitor:log:list:api',
       'monitor:log:delete:api'
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: '系统管理员',
    code: 'system_admin',
    description: '拥有系统管理权限',
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
      'system:menu:view'
    ],
    status: 'active',
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-02 00:00:00'
  },
  {
    id: 3,
    name: '普通用户',
    code: 'user',
    description: '只有基本查看权限',
    permissions: [
      'dashboard:view'
    ],
    status: 'active',
    createTime: '2024-01-03 00:00:00',
    updateTime: '2024-01-03 00:00:00'
  },
  {
    id: 4,
    name: '用户管理员',
    code: 'user_admin',
    description: '只能管理用户',
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