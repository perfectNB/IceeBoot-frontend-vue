import { request } from '@/utils/request'
import type { Role } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockRoleService } from '@/mock/services'
import type { Role as MockRole } from '@/mock/data'

// 获取角色列表
export const getRoles = async (): Promise<Role[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const mockRoles = await MockRoleService.getRoleList({ page: 1, size: 1000 })
    return mockRoles.list.map(role => ({
      ...role,
      id: role.id.toString() // 确保id类型兼容
    }))
  } else {
    // 调用真实API
    const response = await request.get<Role[]>('/role')
    return response.data
  }
}

// 创建角色
export const createRole = async (data: Partial<Role>): Promise<Role> => {
  if (isMockEnabled()) {
    // 使用Mock数据 - 转换类型
    const mockData: Partial<MockRole> = {
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
    const response = await request.post<Role>('/role', data)
    return response.data
  }
}

// 更新角色
export const updateRole = async (id: string | number, data: Partial<Role>): Promise<Role> => {
  if (isMockEnabled()) {
    // Mock暂不实现更新功能
    throw new Error('Mock模式下暂不支持更新角色')
  } else {
    // 调用真实API
    const response = await request.put<Role>(`/role/${id}`, data)
    return response.data
  }
}

// 删除角色
export const deleteRole = async (id: string | number): Promise<boolean> => {
  if (isMockEnabled()) {
    // Mock暂不实现删除功能
    throw new Error('Mock模式下暂不支持删除角色')
  } else {
    // 调用真实API
    await request.delete(`/role/${id}`)
    return true
  }
}

// 获取角色详情
export const getRoleById = async (id: string | number): Promise<Role> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockRoleService.getRoleById(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<Role>(`/role/${id}`)
    return response.data
  }
}