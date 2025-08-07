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
      email: 'admin@zboot.com',
      roles: ['admin'],
      permissions: ['*:*:*']
    }
  },
  {
    username: 'editor',
    password: '111111',
    user: {
      id: 2,
      username: 'editor',
      nickname: '编辑员',
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      email: 'editor@zboot.com',
      roles: ['editor'],
      permissions: ['system:user:view', 'system:role:view']
    }
  }
]