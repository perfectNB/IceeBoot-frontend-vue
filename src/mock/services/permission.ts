/**
 * Mock权限服务
 */

import type { Permission, PageParams, PageResult } from '@/types'
import { mockPermissions } from '../data'
import { mockLog, mockDelay } from '@/config/mock'

export class MockPermissionService {
  
  // 获取权限列表
  static async getPermissions(params: PageParams): Promise<PageResult<Permission>> {
    await mockDelay()
    mockLog('获取权限列表', params)
    
    let filteredPermissions = [...mockPermissions]
    
    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredPermissions = filteredPermissions.filter(permission => 
        permission.name.toLowerCase().includes(keyword) ||
        permission.code.toLowerCase().includes(keyword) ||
        permission.description?.toLowerCase().includes(keyword)
      )
    }
    
    // 分页
    const total = filteredPermissions.length
    const start = (params.page - 1) * params.size
    const end = start + params.size
    const list = filteredPermissions.slice(start, end)
    
    return {
      list,
      total,
      page: params.page,
      size: params.size,
      pages: Math.ceil(total / params.size)
    }
  }
  
  // 获取所有权限
  static async getAllPermissions(): Promise<Permission[]> {
    await mockDelay()
    mockLog('获取所有权限')
    return [...mockPermissions]
  }
  
  // 根据ID获取权限
  static async getPermissionById(permissionId: number): Promise<Permission> {
    await mockDelay()
    mockLog('根据ID获取权限', { permissionId })
    
    const permission = mockPermissions.find(p => p.id === permissionId)
    if (!permission) {
      throw new Error('权限不存在')
    }
    
    return permission
  }
  
  // 创建权限
  static async createPermission(permissionData: Partial<Permission>): Promise<Permission> {
    await mockDelay()
    mockLog('创建权限', permissionData)
    
    const newPermission: Permission = {
      id: Math.max(...mockPermissions.map(p => Number(p.id))) + 1,
      name: permissionData.name || '',
      code: permissionData.code || '',
      type: permissionData.type || 'menu',
      parentId: permissionData.parentId,
      path: permissionData.path,
      method: permissionData.method,
      description: permissionData.description,
      status: permissionData.status || 'active',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    mockPermissions.push(newPermission)
    return newPermission
  }
  
  // 更新权限
  static async updatePermission(permissionId: number, permissionData: Partial<Permission>): Promise<Permission> {
    await mockDelay()
    mockLog('更新权限', { permissionId, permissionData })
    
    const permissionIndex = mockPermissions.findIndex(p => p.id === permissionId)
    if (permissionIndex === -1) {
      throw new Error('权限不存在')
    }
    
    const updatedPermission = {
      ...mockPermissions[permissionIndex],
      ...permissionData,
      id: permissionId,
      updateTime: new Date().toISOString()
    }
    
    mockPermissions[permissionIndex] = updatedPermission
    return updatedPermission
  }
  
  // 删除权限
  static async deletePermission(permissionId: number): Promise<boolean> {
    await mockDelay()
    mockLog('删除权限', { permissionId })
    
    const permissionIndex = mockPermissions.findIndex(p => p.id === permissionId)
    if (permissionIndex === -1) {
      throw new Error('权限不存在')
    }
    
    mockPermissions.splice(permissionIndex, 1)
    return true
  }
}