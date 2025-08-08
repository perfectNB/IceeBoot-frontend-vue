/**
 * 权限相关Mock数据
 */

import type { Permission } from '@/types'

// 权限Mock数据
export const mockPermissions: Permission[] = [
  {
    id: '1',
    name: '工作台查看',
    code: 'dashboard:view',
    type: 'menu',
    parentId: null,
    path: '/admin/dashboard',
    description: '工作台查看权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '2',
    name: '系统管理',
    code: 'system',
    type: 'menu',
    parentId: null,
    path: '/admin/system',
    description: '系统管理模块',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '3',
    name: '用户管理',
    code: 'system:user',
    type: 'menu',
    parentId: '2',
    path: '/admin/system/user',
    description: '用户管理页面',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '4',
    name: '查看用户',
    code: 'system:user:view',
    type: 'button',
    parentId: '3',
    description: '查看用户权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '5',
    name: '新增用户',
    code: 'system:user:create',
    type: 'button',
    parentId: '3',
    description: '新增用户按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '6',
    name: '编辑用户',
    code: 'system:user:edit',
    type: 'button',
    parentId: '3',
    description: '编辑用户按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '7',
    name: '删除用户',
    code: 'system:user:delete',
    type: 'button',
    parentId: '3',
    description: '删除用户按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '8',
    name: '获取用户列表',
    code: 'system:user:list:api',
    type: 'api',
    parentId: '3',
    path: '/api/v1/users',
    method: 'GET',
    description: '获取用户列表接口',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '9',
    name: '创建用户接口',
    code: 'system:user:create:api',
    type: 'api',
    parentId: '3',
    path: '/api/v1/users',
    method: 'POST',
    description: '创建用户接口',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '10',
    name: '更新用户接口',
    code: 'system:user:update:api',
    type: 'api',
    parentId: '3',
    path: '/api/v1/users/{id}',
    method: 'PUT',
    description: '更新用户接口',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '11',
    name: '删除用户接口',
    code: 'system:user:delete:api',
    type: 'api',
    parentId: '3',
    path: '/api/v1/users/{id}',
    method: 'DELETE',
    description: '删除用户接口',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '12',
    name: '角色管理',
    code: 'system:role',
    type: 'menu',
    parentId: '2',
    path: '/admin/system/role',
    description: '角色管理页面',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '13',
    name: '查看角色',
    code: 'system:role:view',
    type: 'button',
    parentId: '12',
    description: '查看角色权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '14',
    name: '新增角色',
    code: 'system:role:create',
    type: 'button',
    parentId: '12',
    description: '新增角色按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '15',
    name: '编辑角色',
    code: 'system:role:edit',
    type: 'button',
    parentId: '12',
    description: '编辑角色按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '16',
    name: '删除角色',
    code: 'system:role:delete',
    type: 'button',
    parentId: '12',
    description: '删除角色按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '17',
    name: '权限管理',
    code: 'system:permission',
    type: 'menu',
    parentId: '2',
    path: '/admin/system/permission',
    description: '权限管理页面',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '18',
    name: '查看权限',
    code: 'system:permission:view',
    type: 'button',
    parentId: '17',
    description: '查看权限权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '19',
    name: '新增权限',
    code: 'system:permission:create',
    type: 'button',
    parentId: '17',
    description: '新增权限按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '20',
    name: '编辑权限',
    code: 'system:permission:edit',
    type: 'button',
    parentId: '17',
    description: '编辑权限按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '21',
    name: '删除权限',
    code: 'system:permission:delete',
    type: 'button',
    parentId: '17',
    description: '删除权限按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '22',
    name: '菜单管理',
    code: 'system:menu',
    type: 'menu',
    parentId: '2',
    path: '/admin/system/menu',
    description: '菜单管理页面',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '23',
    name: '查看菜单',
    code: 'system:menu:view',
    type: 'button',
    parentId: '22',
    description: '查看菜单权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '24',
    name: '新增菜单',
    code: 'system:menu:create',
    type: 'button',
    parentId: '22',
    description: '新增菜单按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '25',
    name: '编辑菜单',
    code: 'system:menu:edit',
    type: 'button',
    parentId: '22',
    description: '编辑菜单按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: '26',
    name: '删除菜单',
    code: 'system:menu:delete',
    type: 'button',
    parentId: '22',
    description: '删除菜单按钮权限',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
   }
]