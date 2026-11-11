import { request } from '@/utils/request'
import type { User, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockUserService } from '@/mock/services/user'

// 创建用户数据接口
export interface CreateUserData extends Partial<User> {
  password?: string
  [key: string]: unknown
}

// 获取用户列表
export type UserListItem = Omit<User, 'permissions' | 'menus'>

export const getUserList = async (params: PageParams): Promise<PageResult<UserListItem>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.getUserList(params)
  } else {
    // 调用真实API
    return await request.get<PageResult<UserListItem>>('/api/v1/users', params)
  }
}

// 获取用户详情
export const getUserById = async (id: string | number): Promise<User> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.getUserInfo(Number(id))
  } else {
    // 调用真实API
    return await request.get<User>(`/api/v1/users/${id}`)
  }
}

// 创建用户
export const createUser = async (data: CreateUserData): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.createUser(data)
  } else {
    // 调用真实API
    await request.post('/api/v1/users', data)
  }
}

// 更新用户
export const updateUser = async (id: string | number, data: Partial<User>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.updateUser(Number(id), data)
  } else {
    // 调用真实API - 后端接口是PUT /api/v1/users，ID包含在请求体中
    const requestData = { ...data, id }
    await request.put('/api/v1/users', requestData)
  }
}

// 删除用户（批量删除）
export const deleteUsers = async (ids: (string | number)[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.deleteUsers(ids.map(Number))
  } else {
    // 调用真实API
    await request.delete('/api/v1/users', {}, {
      data: ids.map(Number)
    })
    return true
  }
}

// 删除单个用户（兼容性保留）
export const deleteUser = async (id: string | number): Promise<boolean> => {
  return await deleteUsers([id])
}

// 重置用户密码
export const resetUserPassword = async (id: string | number, newPassword: string): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.resetPassword(Number(id), newPassword)
  } else {
    // 调用真实API
    await request.put(`/api/v1/users/${id}/password`, { newPassword })
  }
}

// 更新用户状态
export const updateUserStatus = async (id: string | number, status: 'active' | 'inactive'): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.updateUserStatus(Number(id), status)
  } else {
    // 调用真实API - PUT方法，状态作为查询参数
    await request.put(`/api/v1/users/${id}/status?status=${status}`)
  }
}
