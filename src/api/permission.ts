import { request } from '@/utils/request'
import type { Permission, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockPermissionService } from '@/mock/services/permission'

// 获取权限列表
export const getPermissions = async (params: PageParams): Promise<PageResult<Permission>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockPermissionService.getPermissions(params)
  } else {
    // 调用真实API
    const response = await request.get<{result: PageResult<Permission>}>('/api/v1/permissions', { params })
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<Permission>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取权限列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取所有权限（不分页）
export const getAllPermissions = async (): Promise<Permission[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据 - 返回所有权限
    return await MockPermissionService.getAllPermissions()
  } else {
    // 调用真实API
    const response = await request.get<{result: Permission[]}>('/api/v1/permissions')
    const apiResponse = response as unknown as {code: number, message: string, result: Permission[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取所有权限响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 创建权限
export const createPermission = async (data: Partial<Permission>): Promise<Permission> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockPermissionService.createPermission(data)
  } else {
    // 调用真实API
    const response = await request.post<{result: Permission}>('/api/v1/permissions', data)
    const apiResponse = response as unknown as {code: number, message: string, result: Permission, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('创建权限响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 更新权限
export const updatePermission = async (id: string | number, data: Partial<Permission>): Promise<Permission> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockPermissionService.updatePermission(Number(id), data)
  } else {
    // 调用真实API
    const response = await request.put<{result: Permission}>(`/api/v1/permissions/${id}`, data)
    const apiResponse = response as unknown as {code: number, message: string, result: Permission, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('更新权限响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 删除权限
export const deletePermission = async (id: string | number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockPermissionService.deletePermission(Number(id))
  } else {
    // 调用真实API
    const response = await request.delete<{result: boolean}>(`/api/v1/permissions/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, result: boolean, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除权限响应数据格式错误')
    }
  }
}

// 获取权限详情
export const getPermissionById = async (id: string | number): Promise<Permission> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockPermissionService.getPermissionById(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<{result: Permission}>(`/api/v1/permissions/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, result: Permission, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取权限详情响应数据格式错误')
    }
    return apiResponse.result
  }
}
