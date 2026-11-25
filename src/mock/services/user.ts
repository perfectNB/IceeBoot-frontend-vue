/**
 * Mock用户服务
 */

import type { User, PageParams, PageResult } from '@/types'
import { mockUsers, mockLoginUsers, mockRoles } from '../data'
import { mockLog, mockDelay } from '@/config/mock'

function roleCodes(items: NonNullable<User['roleIds']>) {
  const ids = new Set(items.map(item => String(typeof item === 'object' ? item.id : item)))
  return mockRoles.filter(role => ids.has(String(role.id))).map(role => role.code)
}

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
    
    for (const field of ['username', 'nickname', 'email', 'phone'] as const) {
      const filter = String(params[field] ?? '').trim().toLowerCase()
      if (filter) filteredUsers = filteredUsers.filter(user => user[field]?.toLowerCase().includes(filter))
    }
    if (params.status) filteredUsers = filteredUsers.filter(user => user.status === params.status)

    // 分页参数默认值
    const pageNum = params.pageNum || 1
    const pageSize = params.pageSize || 10
    
    // 分页
    const total = filteredUsers.length
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const records = filteredUsers.slice(start, end).map(user => ({ ...user, roleList: mockRoles.filter(role => user.roles?.includes(role.code)) }))
    const pages = Math.ceil(total / pageSize)
    
    return {
      records,
      total,
      current: pageNum,
      size: pageSize,
      pages,
      hasPrevious: pageNum > 1,
      hasNext: pageNum < pages
    }
  }
  
  // 创建用户
  static async createUser(userData: Partial<User> & { password?: string }): Promise<User> {
    await mockDelay()
    mockLog('创建用户')
    
    const newUser: User = {
      id: Math.max(0, ...mockUsers.map(u => Number(u.id))) + 1,
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
    
    if (userData.roleIds) newUser.roles = roleCodes(userData.roleIds)
    newUser.status = userData.status ?? 'active'
    mockUsers.push(newUser)
    if (userData.password) mockLoginUsers.push({ username: newUser.username, password: userData.password, user: newUser })
    return newUser
  }
  
  // 更新用户
  static async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    await mockDelay()
    mockLog('更新用户', { userId })
    
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
    
    if (userData.roleIds) updatedUser.roles = roleCodes(userData.roleIds)
    mockUsers[userIndex] = updatedUser
    const account = mockLoginUsers.find(row => row.user.id === userId)
    if (account) account.username = updatedUser.username
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
        const accountIndex = mockLoginUsers.findIndex(row => row.user.id === userId)
        if (accountIndex >= 0) mockLoginUsers.splice(accountIndex, 1)
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
    mockLog('重置用户密码', { userId })
    
    const user = mockUsers.find(u => u.id === userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    const account = mockLoginUsers.find(row => row.user.id === userId)
    if (account) account.password = newPassword
    else mockLoginUsers.push({ username: user.username, password: newPassword, user })
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