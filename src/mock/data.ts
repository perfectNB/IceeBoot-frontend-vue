/**
 * Mock数据定义
 * 包含用户、角色、权限、菜单等模拟数据
 */

import type { User, MenuItem } from '@/types'

// 用户Mock数据
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    nickname: '超级管理员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'admin@zboot.com',
    phone: '13800138000',
    roles: ['admin', 'super'],
    permissions: ['*:*:*'],
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    username: 'editor',
    nickname: '编辑员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'editor@zboot.com',
    phone: '13800138001',
    roles: ['editor'],
    permissions: ['system:user:view', 'system:role:view'],
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-02 00:00:00'
  },
  {
    id: 3,
    username: 'viewer',
    nickname: '查看员',
    avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
    email: 'viewer@zboot.com',
    phone: '13800138002',
    roles: ['viewer'],
    permissions: ['system:user:view'],
    createTime: '2024-01-03 00:00:00',
    updateTime: '2024-01-03 00:00:00'
  }
]

// 角色Mock数据
export interface Role {
  id: number
  name: string
  code: string
  description: string
  permissions: string[]
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

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

// 权限Mock数据
export interface Permission {
  id: number
  name: string
  code: string
  type: 'menu' | 'button' | 'api'
  parentId: number | null
  path?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

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
    meta: {
      title: '工作台',
      icon: 'DataAnalysis',
      requiresAuth: true
    }
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
    meta: {
      title: '系统管理',
      icon: 'Setting',
      requiresAuth: true
    },
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
        meta: {
          title: '用户管理',
          icon: 'User',
          requiresAuth: true,
          permissions: ['system:user:view']
        }
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
        meta: {
          title: '角色管理',
          icon: 'UserFilled',
          requiresAuth: true,
          permissions: ['system:role:view']
        }
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
        meta: {
          title: '权限管理',
          icon: 'Key',
          requiresAuth: true,
          permissions: ['system:permission:view']
        }
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
        meta: {
          title: '菜单管理',
          icon: 'Menu',
          requiresAuth: true,
          permissions: ['system:menu:view']
        }
      }
    ]
  }
]