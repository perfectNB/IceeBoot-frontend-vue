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
    const response = await request.get<PageResult<Permission>>('/permissions',  params )
    const apiResponse = response as unknown as {code: number, message: string, data: PageResult<Permission>, success: boolean}
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取权限列表响应数据格式错误')
    }
    return apiResponse.data
  }
}

// 获取所有权限（不分页）
export const getAllPermissions = async (): Promise<Permission[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据 - 返回所有权限
    return await MockPermissionService.getAllPermissions()
  } else {
    // 调用真实API

    const response = await request.get<Permission[]>('/api/v1/permissions/tree')
    const apiResponse = response as unknown as {code: number, message: string, data: Permission[], success: boolean}
    console.log(apiResponse)
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取所有权限响应数据格式错误')
    }
    return apiResponse.data
  }
}

// 创建权限
export const createPermission = async (data: Partial<Permission>): Promise<Permission> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockPermissionService.createPermission(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/permissions', data)
    const apiResponse = response as unknown as {code: number, message: string, data: Permission, success: boolean}
    if (!apiResponse || !apiResponse.success || !apiResponse.data) {
      throw new Error('创建权限失败')
    }
    return apiResponse.data
  }
}

// 更新权限
export const updatePermission = async (id: string | number, data: Partial<Permission>): Promise<Permission> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockPermissionService.updatePermission(Number(id), data)
  } else {
    // 调用真实API - 后端PUT请求需要在请求体中包含ID
    const requestData = { ...data, id }
    const response = await request.put<Permission>('/api/v1/permissions', requestData)
    const apiResponse = response as unknown as {code: number, message: string, data: Permission, success: boolean}
    if (!apiResponse || !apiResponse.success || !apiResponse.data) {
      throw new Error('更新权限失败')
    }
    return apiResponse.data
  }
}

// 删除权限
export const deletePermission = async (id: string | number): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockPermissionService.deletePermission(Number(id))
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/permissions', {}, {
      data: [Number(id)]
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除权限失败')
    }
    return true
  }
}

// 批量删除权限
export const deletePermissions = async (ids: (string | number)[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    for (const id of ids) {
      await MockPermissionService.deletePermission(Number(id))
    }
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/permissions', {}, {
      data: ids.map(Number)
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('批量删除权限失败')
    }
    return true
  }
}

// 获取权限详情
export const getPermissionById = async (id: string | number): Promise<Permission> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockPermissionService.getPermissionById(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<Permission>(`/api/v1/permissions/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, data: Permission, success: boolean}
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取权限详情响应数据格式错误')
    }
    return apiResponse.data
  }
}
