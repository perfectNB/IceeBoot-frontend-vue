import { request } from '@/utils/request'
import type { AxiosRequestConfig } from 'axios'
import type { MenuItem, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockMenuService } from '@/mock/services/menu'

// 获取菜单列表（分页）
export const getMenus = async (params: PageParams): Promise<PageResult<MenuItem>> => {
  if (isMockEnabled()) {
    // 使用Mock数据 - 模拟分页
    const allMenus = await MockMenuService.getAllMenus()
    let filteredMenus = [...allMenus]

    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredMenus = filteredMenus.filter(menu =>
        menu.title.toLowerCase().includes(keyword) ||
        menu.name.toLowerCase().includes(keyword) ||
        menu.path?.toLowerCase().includes(keyword)
      )
    }

    // 分页
    const total = filteredMenus.length
    const pageNum = params.pageNum || 1
    const pageSize = params.pageSize || 20
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const records = filteredMenus.slice(start, end)
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
  } else {
    // 调用真实API
    return await request.get<PageResult<MenuItem>>('/api/v1/menus', params)
  }
}

// 获取用户菜单
export const getUserMenus = async (
  userId?: number,
  config?: AxiosRequestConfig & { skipErrorMessage?: boolean }
): Promise<MenuItem[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response=await MockMenuService.getUserMenus(userId || 1)
    return response
  } else {
    // 调用真实API
    const menus = await request.get<MenuItem[]>('/api/v1/menus/user', undefined, config)
    return menus.map(normalizeMenuPermissions)
  }
}

// 获取所有菜单（树形结构，不分页）
export const getAllMenus = async (): Promise<MenuItem[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.getAllMenus()
  } else {
    // 调用真实API
    return await request.get<MenuItem[]>('/api/v1/menus/tree')
  }
}

// 创建菜单
export const createMenu = async (data: Partial<MenuItem>): Promise<MenuItem> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.createMenu(data)
  } else {
    // 调用真实API
    return await request.post<MenuItem>('/api/v1/menus', data)
  }
}

// 更新菜单
export const updateMenu = async (id: string | number, data: Partial<MenuItem>): Promise<MenuItem> => {
  if (isMockEnabled()) {
    // 使用Mock数据 - 先获取现有菜单，然后删除再创建（模拟更新）
    const existingMenu = await MockMenuService.getMenuById(Number(id))
    await MockMenuService.deleteMenu(Number(id))
    const updatedMenu = await MockMenuService.createMenu({ ...existingMenu, ...data, id })
    return updatedMenu
  } else {
    // 调用真实API - 后端PUT请求需要在请求体中包含ID
    const requestData = { ...data, id }
    return await request.put<MenuItem>('/api/v1/menus', requestData)
  }
}

// 删除菜单
export const deleteMenu = async (id: string | number): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockMenuService.deleteMenu(Number(id))
    return true
  } else {
    // 调用真实API
    await request.delete('/api/v1/menus', {}, {
      data: [Number(id)]
    })
    return true
  }
}

// 批量删除菜单
export const deleteMenus = async (ids: (string | number)[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    for (const id of ids) {
      await MockMenuService.deleteMenu(Number(id))
    }
    return true
  } else {
    // 调用真实API
    await request.delete('/api/v1/menus', {}, {
      data: ids.map(Number)
    })
    return true
  }
}

// 获取菜单详情
export const getMenuById = async (id: string | number): Promise<MenuItem> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.getMenuById(Number(id))
  } else {
    // 调用真实API
    return await request.get<MenuItem>(`/api/v1/menus/${id}`)
  }
}

// 用户菜单接口兼容数据库中的逗号分隔格式，路由与菜单组件统一使用权限数组。
function normalizeMenuPermissions(menu: MenuItem): MenuItem {
  const raw: unknown = menu.permissions
  return {
    ...menu,
    permissions: Array.isArray(raw) ? raw.filter((code): code is string => typeof code === 'string')
      : typeof raw === 'string' ? raw.split(',').map(code => code.trim()).filter(Boolean) : [],
    children: menu.children?.map(normalizeMenuPermissions),
  }
}
