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
    const response = await request.get<{result: PageResult<User>}>('/api/v1/users', { params })
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
export const createUser = async (data: CreateUserData): Promise<User> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.createUser(data)
  } else {
    // 调用真实API
    const response = await request.post<{result: User}>('/api/v1/users', data)
    const apiResponse = response as unknown as {code: number, message: string, result: User, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('创建用户响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 更新用户
export const updateUser = async (id: string | number, data: Partial<User>): Promise<User> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.updateUser(Number(id), data)
  } else {
    // 调用真实API
    const response = await request.put<{result: User}>(`/api/v1/users/${id}`, data)
    const apiResponse = response as unknown as {code: number, message: string, result: User, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('更新用户响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 删除用户
export const deleteUser = async (id: string | number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.deleteUser(Number(id))
  } else {
    // 调用真实API
    const response = await request.delete<{result: boolean}>(`/api/v1/users/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, result: boolean, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除用户响应数据格式错误')
    }
  }
}

// 重置用户密码
export const resetUserPassword = async (id: string | number): Promise<{ newPassword: string }> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockUserService.resetPassword(Number(id))
  } else {
    // 调用真实API
    const response = await request.post<{result: { newPassword: string }}>(`/api/v1/users/${id}/reset-password`)
    const apiResponse = response as unknown as {code: number, message: string, result: { newPassword: string }, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('重置用户密码响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 更新用户状态
export const updateUserStatus = async (id: string | number, status: 'active' | 'inactive'): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockUserService.updateUserStatus(Number(id), status)
  } else {
    // 调用真实API
    const response = await request.patch<{result: boolean}>(`/api/v1/users/${id}/status`, { status })
    const apiResponse = response as unknown as {code: number, message: string, result: boolean, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新用户状态响应数据格式错误')
    }
  }
}
