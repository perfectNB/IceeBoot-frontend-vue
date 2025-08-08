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
export const getUserList = async (params: PageParams): Promise<PageResult<User>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.getUserList(params)
  } else {
    // 调用真实API
    const response = await request.get<PageResult<User>>('/api/v1/users', { params })
    return response.data
  }
}

// 获取用户详情
export const getUserById = async (id: string | number): Promise<User> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.getUserInfo(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<User>(`/api/v1/users/${id}`)
    return response.data
  }
}

// 创建用户
export const createUser = async (data: CreateUserData): Promise<User> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.createUser(data)
  } else {
    // 调用真实API
    const response = await request.post<User>('/api/v1/users', data)
    return response.data
  }
}

// 更新用户
export const updateUser = async (id: string | number, data: Partial<User>): Promise<User> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.updateUser(Number(id), data)
  } else {
    // 调用真实API
    const response = await request.put<User>(`/api/v1/users/${id}`, data)
    return response.data
  }
}

// 删除用户
export const deleteUser = async (id: string | number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.deleteUser(Number(id))
  } else {
    // 调用真实API
    await request.delete(`/api/v1/users/${id}`)
  }
}

// 重置用户密码
export const resetUserPassword = async (id: string | number): Promise<{ newPassword: string }> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.resetPassword(Number(id))
  } else {
    // 调用真实API
    const response = await request.post<{ newPassword: string }>(`/api/v1/users/${id}/reset-password`)
    return response.data
  }
}

// 更新用户状态
export const updateUserStatus = async (id: string | number, status: 'active' | 'inactive'): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.updateUserStatus(Number(id), status)
  } else {
    // 调用真实API
    await request.patch(`/api/v1/users/${id}/status`, { status })
  }
}
