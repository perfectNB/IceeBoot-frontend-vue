/**
 * 权限相关Mock数据
 */

import type { Permission } from '@/types'

// 权限Mock数据
export const mockPermissions: Permission[] = [
  {
    id: 1,
    name: '系统管理',
    code: 'system',
    type: 'menu',
    parentId: null,
    description: '系统管理模块',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: '用户管理',
    code: 'system:user',
    type: 'menu',
    parentId: 1,
    path: '/admin/system/user',
    description: '用户管理页面',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 3,
    name: '查看用户',
    code: 'system:user:view',
    type: 'button',
    parentId: 2,
    description: '查看用户列表',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 4,
    name: '编辑用户',
    code: 'system:user:edit',
    type: 'button',
    parentId: 2,
    description: '编辑用户信息',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 5,
    name: '删除用户',
    code: 'system:user:delete',
    type: 'button',
    parentId: 2,
    description: '删除用户',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 6,
    name: '角色管理',
    code: 'system:role',
    type: 'menu',
    parentId: 1,
    path: '/admin/system/role',
    description: '角色管理页面',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 7,
    name: '查看角色',
    code: 'system:role:view',
    type: 'button',
    parentId: 6,
    description: '查看角色列表',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 8,
    name: '权限管理',
    code: 'system:permission',
    type: 'menu',
    parentId: 1,
    path: '/admin/system/permission',
    description: '权限管理页面',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 9,
    name: '菜单管理',
    code: 'system:menu',
    type: 'menu',
    parentId: 1,
    path: '/admin/system/menu',
    description: '菜单管理页面',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  }
]