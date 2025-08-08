/**
 * Mock角色服务
 */

import type { Role, PageParams, PageResult } from '@/types'
import { mockRoles } from '../data'
import { mockLog, mockDelay } from '@/config/mock'

export class MockRoleService {
  
  // 获取角色列表
  static async getRoles(params: PageParams): Promise<PageResult<Role>> {
    await mockDelay()
    mockLog('获取角色列表', params)
    
    let filteredRoles = [...mockRoles]
    
    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredRoles = filteredRoles.filter(role => 
        role.name.toLowerCase().includes(keyword) ||
        role.description?.toLowerCase().includes(keyword)
      )
    }
    
    // 分页
    const total = filteredRoles.length
    const start = (params.page - 1) * params.size
    const end = start + params.size
    const list = filteredRoles.slice(start, end)
    
    return {
      list,
      total,
      page: params.page,
      size: params.size,
      pages: Math.ceil(total / params.size)
    }
  }
  
  // 获取所有角色
  static async getAllRoles(): Promise<Role[]> {
    await mockDelay()
    mockLog('获取所有角色')
    return [...mockRoles]
  }
  
  // 根据ID获取角色
  static async getRoleById(roleId: number): Promise<Role> {
    await mockDelay()
    mockLog('根据ID获取角色', { roleId })
    
    const role = mockRoles.find(r => r.id === roleId)
    if (!role) {
      throw new Error('角色不存在')
    }
    
    return role
  }
  
  // 创建角色
  static async createRole(roleData: Partial<Role>): Promise<Role> {
    await mockDelay()
    mockLog('创建角色', roleData)
    
    const newRole: Role = {
      id: Math.max(...mockRoles.map(r => Number(r.id))) + 1,
      name: roleData.name || '',
      code: roleData.code || '',
      description: roleData.description,
      permissions: roleData.permissions || [],
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    mockRoles.push(newRole)
    return newRole
  }
  
  // 更新角色
  static async updateRole(roleId: number, roleData: Partial<Role>): Promise<Role> {
    await mockDelay()
    mockLog('更新角色', { roleId, roleData })
    
    const roleIndex = mockRoles.findIndex(r => r.id === roleId)
    if (roleIndex === -1) {
      throw new Error('角色不存在')
    }
    
    const updatedRole = {
      ...mockRoles[roleIndex],
      ...roleData,
      id: roleId,
      updateTime: new Date().toISOString()
    }
    
    mockRoles[roleIndex] = updatedRole
    return updatedRole
  }
  
  // 删除角色
  static async deleteRole(roleId: number): Promise<boolean> {
    await mockDelay()
    mockLog('删除角色', { roleId })
    
    const roleIndex = mockRoles.findIndex(r => r.id === roleId)
    if (roleIndex === -1) {
      throw new Error('角色不存在')
    }
    
    mockRoles.splice(roleIndex, 1)
    return true
  }

  // 保存角色权限
  static async saveRolePermissions(roleId: number, permissionIds: string[]): Promise<void> {
    await mockDelay()
    mockLog('保存角色权限', { roleId, permissionIds })
    
    const roleIndex = mockRoles.findIndex(r => r.id === roleId)
    if (roleIndex === -1) {
      throw new Error('角色不存在')
    }
    
    // 更新角色的权限列表
    mockRoles[roleIndex] = {
      ...mockRoles[roleIndex],
      permissions: permissionIds,
      updateTime: new Date().toISOString()
    }
  }
}