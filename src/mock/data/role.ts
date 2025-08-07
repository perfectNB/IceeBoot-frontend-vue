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
    permissions: ['*:*:*'],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: '编辑员',
    code: 'editor',
    description: '拥有编辑权限',
    permissions: ['system:user:view', 'system:user:edit', 'system:role:view'],
    status: 'active',
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-02 00:00:00'
  },
  {
    id: 3,
    name: '查看员',
    code: 'viewer',
    description: '只有查看权限',
    permissions: ['system:user:view'],
    status: 'active',
    createTime: '2024-01-03 00:00:00',
    updateTime: '2024-01-03 00:00:00'
  }
]