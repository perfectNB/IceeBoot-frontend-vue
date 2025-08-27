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
    
    // 分页参数默认值
    const page = params.page || 1
    const size = params.size || 10
    
    // 分页
    const total = filteredUsers.length
    const start = (page - 1) * size
    const end = start + size
    const records = filteredUsers.slice(start, end)
    const pages = Math.ceil(total / size)
    
    return {
      records,
      total,
      current: page,
      size: size,
      pages,
      hasPrevious: page > 1,
      hasNext: page < pages
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
  
  // 批量删除用户
  static async deleteUsers(userIds: number[]): Promise<boolean> {
    await mockDelay()
    mockLog('批量删除用户', { userIds })
    
    for (const userId of userIds) {
      const userIndex = mockUsers.findIndex(u => u.id === userId)
      if (userIndex !== -1) {
        mockUsers.splice(userIndex, 1)
      }
    }
    return true
  }
  
  // 删除单个用户（兼容性保留）
  static async deleteUser(userId: number): Promise<boolean> {
    return await this.deleteUsers([userId])
  }

  // 重置用户密码
  static async resetPassword(userId: number, newPassword: string): Promise<void> {
    await mockDelay()
    mockLog('重置用户密码', { userId, newPassword })
    
    const user = mockUsers.find(u => u.id === userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    // 在实际应用中，这里会更新用户的密码
    // 这里只是模拟，不实际存储密码
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