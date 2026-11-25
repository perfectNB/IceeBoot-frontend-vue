/**
 * Mock角色服务
 */

import type { Role, PageParams, PageResult } from '@/types'
import { MockPermissionService } from './permission'
import { mockRoles, mockMenus } from '../data'
import { mockLog, mockDelay } from '@/config/mock'

function markGranted<T extends { id: string | number; children?: T[] }>(rows: T[], selected: Set<string>, all: boolean): T[] {
  return rows.map(row => ({
    ...row, hasPermission: all || selected.has(String(row.id)),
    children: row.children ? markGranted(row.children, selected, all) : undefined,
  }))
}

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
    const pageNum = params.pageNum || 1
    const pageSize = params.pageSize || 20
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const records = filteredRoles.slice(start, end)
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
  
  // 获取所有角色
  static async getAllRoles(): Promise<Role[]> {
    await mockDelay()
    mockLog('获取所有角色')
    return [...mockRoles]
  }
  
  // 根据ID获取角色
  static async getRoleById(roleId: number, include?: 'permissions' | 'menus'): Promise<Role> {
    await mockDelay()
    mockLog('根据ID获取角色', { roleId })
    
    const role = mockRoles.find(r => r.id === roleId)
    if (!role) {
      throw new Error('角色不存在')
    }
    
    if (include === 'permissions') {
      const tree = await MockPermissionService.getAllPermissions()
      return { ...role, permissionTree: markGranted(tree, new Set(role.permissions), role.code === 'superAdmin' && !role.permissions) }
    }
    if (include === 'menus') {
      return { ...role, menuTree: markGranted(mockMenus, new Set(role.menus), role.code === 'superAdmin' && !role.menus) }
    }
    return { ...role }
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
      status: roleData.status ?? 'active',
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

  // 保存角色菜单
  static async saveRoleMenus(roleId: number, menuIds: string[]): Promise<void> {
    await mockDelay()
    mockLog('保存角色菜单', { roleId, menuIds })
    
    const roleIndex = mockRoles.findIndex(r => r.id === roleId)
    if (roleIndex === -1) {
      throw new Error('角色不存在')
    }
    
    // 更新角色的菜单列表
    mockRoles[roleIndex] = {
      ...mockRoles[roleIndex],
      menus: menuIds,
      updateTime: new Date().toISOString()
    }
  }
}