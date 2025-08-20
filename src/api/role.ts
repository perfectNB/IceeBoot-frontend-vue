import { request } from '@/utils/request'
import type { Role, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockRoleService } from '@/mock/services/role'

// 获取角色列表
export const getRoles = async (params: PageParams): Promise<PageResult<Role>> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockRoleService.getRoles(params)
  } else {
    // 调用真实API
    const response = await request.get<{result: PageResult<Role>}>('/api/v1/roles', params)
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<Role>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取角色列表响应数据格式错误')
    }
    return apiResponse.result
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
    const response = await request.post<{result: Role}>('/api/v1/roles', data)
    const apiResponse = response as unknown as {code: number, message: string, result: Role, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('创建角色响应数据格式错误')
    }
    return apiResponse.result
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
    const response = await request.put<{result: Role}>(`/api/v1/roles/${id}`, data)
    const apiResponse = response as unknown as {code: number, message: string, result: Role, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('更新角色响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 删除角色
export const deleteRole = async (id: string | number): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockRoleService.deleteRole(Number(id))
    return true
  } else {
    // 调用真实API
    const response = await request.delete<{result: boolean}>(`/api/v1/roles/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, result: boolean, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除角色响应数据格式错误')
    }
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
    const response = await request.get<{result: Role}>(`/api/v1/roles/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, result: Role, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取角色详情响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 保存角色权限
export const saveRolePermissions = async (roleId: string | number, permissionIds: string[]): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockRoleService.saveRolePermissions(Number(roleId), permissionIds)
  } else {
    // 调用真实API
    const response = await request.post<{result: boolean}>(`/api/v1/roles/${roleId}/permissions`, { permissionIds })
    const apiResponse = response as unknown as {code: number, message: string, result: boolean, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('保存角色权限响应数据格式错误')
    }
  }
}
