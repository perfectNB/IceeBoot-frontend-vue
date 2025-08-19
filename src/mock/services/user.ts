/**
 * Mock用户服务
 */

import type { User, PageParams, PageResult } from '@/types'
import { mockUsers } from '../data'
import { mockLog, mockDelay } from '@/config/mock'

export class MockUserService {
  
  // 获取用户信息
  static async getUserInfo(userId: number): Promise<User> {
    await mockDelay()
    mockLog('获取用户信息', { userId })
    
    const user = mockUsers.find(u => u.id === userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    return user
  }
  
  // 获取用户列表
  static async getUserList(params: PageParams): Promise<PageResult<User>> {
    await mockDelay()
    mockLog('获取用户列表', params)
    
    let filteredUsers = [...mockUsers]
    
    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(keyword) ||
        user.nickname?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword)
      )
    }
    
    // 分页
    const total = filteredUsers.length
    const start = (params.page - 1) * params.size
    const end = start + params.size
    const records = filteredUsers.slice(start, end)
    const pages = Math.ceil(total / params.size)
    
    return {
      records,
      total,
      current: params.page,
      size: params.size,
      pages,
      hasPrevious: params.page > 1,
      hasNext: params.page < pages
    }
  }
  
  // 创建用户
  static async createUser(userData: Partial<User> & { password?: string }): Promise<User> {
    await mockDelay()
    mockLog('创建用户', userData)
    
    const newUser: User = {
      id: Math.max(...mockUsers.map(u => Number(u.id))) + 1,
      username: userData.username || '',
      nickname: userData.nickname,
      avatar: userData.avatar,
      email: userData.email,
      phone: userData.phone,
      roles: userData.roles || [],
      permissions: userData.permissions || [],
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    mockUsers.push(newUser)
    return newUser
  }
  
  // 更新用户
  static async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    await mockDelay()
    mockLog('更新用户', { userId, userData })
    
    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('用户不存在')
    }
    
    const updatedUser = {
      ...mockUsers[userIndex],
      ...userData,
      id: userId,
      updateTime: new Date().toISOString()
    }
    
    mockUsers[userIndex] = updatedUser
    return updatedUser
  }
  
  // 删除用户
  static async deleteUser(userId: number): Promise<boolean> {
    await mockDelay()
    mockLog('删除用户', { userId })
    
    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('用户不存在')
    }
    
    mockUsers.splice(userIndex, 1)
    return true
  }

  // 重置用户密码
  static async resetPassword(userId: number): Promise<{ newPassword: string }> {
    await mockDelay()
    mockLog('重置用户密码', { userId })
    
    const user = mockUsers.find(u => u.id === userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    // 生成新密码（实际应用中应该是随机生成）
    const newPassword = '123456'
    
    return { newPassword }
  }

  // 更新用户状态
  static async updateUserStatus(userId: number, status: 'active' | 'inactive'): Promise<void> {
    await mockDelay()
    mockLog('更新用户状态', { userId, status })
    
    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('用户不存在')
    }
    
    // 更新用户状态
    const updatedUser: User = {
      ...mockUsers[userIndex],
      status,
      updateTime: new Date().toISOString()
    }
    
    mockUsers[userIndex] = updatedUser
  }
}