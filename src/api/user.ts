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
    const response = await request.get<{result: PageResult<User>}>('/api/v1/users', params)
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<User>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取用户列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取用户详情
export const getUserById = async (id: string | number): Promise<User> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.getUserInfo(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<{result: User}>(`/api/v1/users/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, result: User, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取用户详情响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 创建用户
export const createUser = async (data: CreateUserData): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.createUser(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/users', data)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建用户失败')
    }
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
    const response = await request.put('/api/v1/users', requestData)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新用户失败')
    }
  }
}

// 删除用户（批量删除）
export const deleteUsers = async (ids: (string | number)[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.deleteUsers(ids.map(Number))
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/users', {}, {
      data: ids.map(Number)
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除用户失败')
    }
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
    const response = await request.put(`/api/v1/users/${id}/password?newPassword=${encodeURIComponent(newPassword)}`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('重置用户密码失败')
    }
  }
}

// 更新用户状态
export const updateUserStatus = async (id: string | number, status: 'active' | 'inactive'): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.updateUserStatus(Number(id), status)
  } else {
    // 调用真实API - PUT方法，状态作为查询参数
    const response = await request.put(`/api/v1/users/${id}/status?status=${status}`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新用户状态失败')
    }
  }
}
