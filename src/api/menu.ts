import { request } from '@/utils/request'
import type { MenuItem } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockMenuService } from '@/mock/services/menu'

// 获取用户菜单
export const getUserMenus = async (userId?: number): Promise<MenuItem[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.getUserMenus(userId || 1)
  } else {
    // 调用真实API
    const response = await request.get<MenuItem[]>('/api/v1/menus/user')
    return response.data
  }
}

// 获取所有菜单
export const getAllMenus = async (): Promise<MenuItem[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.getAllMenus()
  } else {
    // 调用真实API
    const response = await request.get<MenuItem[]>('/api/v1/menus')
    return response.data
  }
}

// 创建菜单
export const createMenu = async (data: Partial<MenuItem>): Promise<MenuItem> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.createMenu(data)
  } else {
    // 调用真实API
    const response = await request.post<MenuItem>('/api/v1/menus', data)
    return response.data
  }
}

// 更新菜单
export const updateMenu = async (id: string | number, data: Partial<MenuItem>): Promise<MenuItem> => {
  if (isMockEnabled()) {
    // Mock暂不实现更新功能
    throw new Error('Mock模式下暂不支持更新菜单')
  } else {
    // 调用真实API
    const response = await request.put<MenuItem>(`/api/v1/menus/${id}`, data)
    return response.data
  }
}

// 删除菜单
export const deleteMenu = async (id: string | number): Promise<boolean> => {
  if (isMockEnabled()) {
    // Mock暂不实现删除功能
    throw new Error('Mock模式下暂不支持删除菜单')
  } else {
    // 调用真实API
    await request.delete(`/api/v1/menus/${id}`)
    return true
  }
}

// 原有的mock数据已迁移到 src/mock/data.ts 文件中统一管理
