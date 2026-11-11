import { request } from '@/utils/request'
import type { Role, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockRoleService } from '@/mock/services/role'

// 分页相关类型
export interface RolePageParams {
  pageNum?: number
  pageSize?: number
  keyword?: string
  name?: string
  code?: string
  status?: string
  [key: string]: string | number | boolean | undefined
}

// 获取角色列表
export const getRoles = async (params: RolePageParams): Promise<PageResult<Role>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockRoleService.getRoles(params)
  } else {
    // 调用真实API
    return await request.get<PageResult<Role>>('/api/v1/roles', params)
  }
}

// 创建角色
export const createRole = async (data: Partial<Role>): Promise<Role> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const mockData = {
      ...data,
      id: data.id ? Number(data.id) : undefined
    }
    const result = await MockRoleService.createRole(mockData)
    return {
      ...result,
      id: result.id.toString()
    }
  } else {
    // 调用真实API
    await request.post('/api/v1/roles', data)
    // 创建成功后返回创建的角色数据，由于接口只返回成功状态，这里返回传入的数据加上一个临时ID
    return {
      ...data,
      id: Date.now(), // 临时ID，实际应该重新获取角色列表
    } as Role
  }
}

// 更新角色
export const updateRole = async (id: string | number, data: Partial<Role>): Promise<Role> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const mockData = {
      ...data,
      id: Number(id)
    }
    const result = await MockRoleService.updateRole(Number(id), mockData)
    return {
      ...result,
      id: result.id.toString()
    }
  } else {
    // 调用真实API
    await request.put(`/api/v1/roles/${id}`, data)
    // 更新成功后返回更新的角色数据
    return {
      ...data,
      id: id,
    } as Role
  }
}

// 删除角色（批量删除）
export const deleteRoles = async (ids: (string | number)[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    for (const id of ids) {
      await MockRoleService.deleteRole(Number(id))
    }
    return true
  } else {
    // 调用真实API - 发送ID数组到请求体
    await request.delete('/api/v1/roles', {}, {
      data: ids.map(Number)
    })
    return true
  }
}

// 删除单个角色（兼容性保留）
export const deleteRole = async (id: string | number): Promise<boolean> => {
  return await deleteRoles([id])
}

// 获取角色详情
export const getRoleById = async (id: string | number, include?: 'permissions' | 'menus'): Promise<Role> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockRoleService.getRoleById(Number(id))
  } else {
    // 调用真实API
    return await request.get<Role>(`/api/v1/roles/${id}`, include ? { include } : undefined)
  }
}

// 保存角色权限
export const saveRolePermissions = async (roleId: string | number, permissionIds: string[]): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockRoleService.saveRolePermissions(Number(roleId), permissionIds)
  } else {
    // 调用真实API
    await request.post(`/api/v1/roles/${roleId}/permissions`, permissionIds.map(Number))
  }
}

// 保存角色菜单
export const saveRoleMenus = async (roleId: string | number, menuIds: string[]): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockRoleService.saveRoleMenus(Number(roleId), menuIds)
  } else {
    // 调用真实API
    await request.post(`/api/v1/roles/${roleId}/menus`, menuIds.map(Number))
  }
}

// 获取所有角色
export const getAllRoles = async (): Promise<Role[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockRoleService.getAllRoles()
  } else {
    // 调用真实API
    return await request.get<Role[]>('/api/v1/roles/getAll')
  }
}

// 更新角色状态
export const updateRoleStatus = async (id: string | number, status: 'active' | 'inactive'): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据 - 通过updateRole函数更新状态
    await updateRole(id, { status })
  } else {
    // 调用真实API - PUT方法，状态作为查询参数
    await request.put(`/api/v1/roles/${id}/status?status=${status}`)
  }
}
