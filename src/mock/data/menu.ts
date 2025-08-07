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