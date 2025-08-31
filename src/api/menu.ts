import { request } from '@/utils/request'
import type { MenuItem, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockMenuService } from '@/mock/services/menu'

// 获取菜单列表（分页）
export const getMenus = async (params: PageParams): Promise<PageResult<MenuItem>> => {
  if (!isMockEnabled()) {
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
    const response = await request.get<{result: PageResult<MenuItem>}>('/api/v1/menus', params)
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<MenuItem>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取菜单列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取用户菜单
export const getUserMenus = async (userId?: number): Promise<MenuItem[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.getUserMenus(userId || 1)
  } else {
    // 调用真实API
    const response = await request.get<{result: MenuItem[]}>('/api/v1/menus/user')
    const apiResponse = response as unknown as {code: number, message: string, result: MenuItem[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取用户菜单响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取所有菜单（树形结构，不分页）
export const getAllMenus = async (): Promise<MenuItem[]> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.getAllMenus()
  } else {
    // 调用真实API
    const response = await request.get<{result: MenuItem[]}>('/api/v1/menus/tree')
    const apiResponse = response as unknown as {code: number, message: string, result: MenuItem[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取所有菜单响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 创建菜单
export const createMenu = async (data: Partial<MenuItem>): Promise<MenuItem> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.createMenu(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/menus', data)
    const apiResponse = response as unknown as {code: number, message: string, result: MenuItem, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建菜单失败')
    }
    return apiResponse.result
  }
}

// 更新菜单
export const updateMenu = async (id: string | number, data: Partial<MenuItem>): Promise<MenuItem> => {
  if (!isMockEnabled()) {
    // 使用Mock数据 - 先获取现有菜单，然后删除再创建（模拟更新）
    const existingMenu = await MockMenuService.getMenuById(Number(id))
    await MockMenuService.deleteMenu(Number(id))
    const updatedMenu = await MockMenuService.createMenu({ ...existingMenu, ...data, id })
    return updatedMenu
  } else {
    // 调用真实API - 后端PUT请求需要在请求体中包含ID
    const requestData = { ...data, id }
    const response = await request.put('/api/v1/menus', requestData)
    const apiResponse = response as unknown as {code: number, message: string, result: MenuItem, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新菜单失败')
    }
    return apiResponse.result
  }
}

// 删除菜单
export const deleteMenu = async (id: string | number): Promise<boolean> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockMenuService.deleteMenu(Number(id))
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/menus', {}, {
      data: [Number(id)]
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除菜单失败')
    }
    return true
  }
}

// 批量删除菜单
export const deleteMenus = async (ids: (string | number)[]): Promise<boolean> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    for (const id of ids) {
      await MockMenuService.deleteMenu(Number(id))
    }
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/menus', {}, {
      data: ids.map(Number)
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('批量删除菜单失败')
    }
    return true
  }
}

// 获取菜单详情
export const getMenuById = async (id: string | number): Promise<MenuItem> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockMenuService.getMenuById(Number(id))
  } else {
    // 调用真实API
    const response = await request.get<{result: MenuItem}>(`/api/v1/menus/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, result: MenuItem, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取菜单详情响应数据格式错误')
    }
    return apiResponse.result
  }
}
