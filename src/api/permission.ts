import { request } from '@/utils/request'
import type { Permission, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockPermissionService } from '@/mock/services'

// 获取权限列表
export const getPermissions = async (params: PageParams): Promise<PageResult<Permission>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockPermissionService.getPermissionList(params)
  } else {
    // 调用真实API
    const response = await request.get<PageResult<Permission>>('/permission', { params })
    return response.data
  }
}

// 获取所有权限（不分页）
export const getAllPermissions = async (): Promise<Permission[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据 - 返回所有权限
    const result = await MockPermissionService.getPermissionList({ page: 1, size: 1000 })
    return result.list
  } else {
    // 调用真实API
    const response = await request.get<Permission[]>('/permission/all')
    return response.data
  }
}

// 创建权限
export const createPermission = async (data: Partial<Permission>): Promise<Permission> => {
  if (isMockEnabled()) {
    // Mock暂不实现创建功能
    throw new Error('Mock模式下暂不支持创建权限')
  } else {
    // 调用真实API
    const response = await request.post<Permission>('/permission', data)
    return response.data
  }
}

// 更新权限
export const updatePermission = async (id: string | number, data: Partial<Permission>): Promise<Permission> => {
  if (isMockEnabled()) {
    // Mock暂不实现更新功能
    throw new Error('Mock模式下暂不支持更新权限')
  } else {
    // 调用真实API
    const response = await request.put<Permission>(`/permission/${id}`, data)
    return response.data
  }
}

// 删除权限
export const deletePermission = async (id: string | number): Promise<boolean> => {
  if (isMockEnabled()) {
    // Mock暂不实现删除功能
    throw new Error('Mock模式下暂不支持删除权限')
  } else {
    // 调用真实API
    await request.delete(`/permission/${id}`)
    return true
  }
}

// 获取权限详情
export const getPermissionById = async (id: string | number): Promise<Permission> => {
  if (isMockEnabled()) {
    // Mock暂不实现获取详情功能
    throw new Error('Mock模式下暂不支持获取权限详情')
  } else {
    // 调用真实API
    const response = await request.get<Permission>(`/permission/${id}`)
    return response.data
  }
}