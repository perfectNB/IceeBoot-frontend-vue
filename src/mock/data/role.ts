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
      'system:menu:delete'
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