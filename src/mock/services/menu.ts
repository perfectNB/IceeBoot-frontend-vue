/**
 * Mock菜单服务
 */

import type { MenuItem } from '@/types'
import { mockMenus } from '../data'
import { mockLog, mockDelay } from '@/config/mock'

export class MockMenuService {

  // 获取用户菜单
  static async getUserMenus(userId?: number): Promise<MenuItem[]> {
    await mockDelay()
    mockLog('获取用户菜单', { userId })

    // 这里可以根据用户ID返回不同的菜单
    // 目前返回所有菜单
    return [...mockMenus]
  }

  // 获取所有菜单
  static async getAllMenus(): Promise<MenuItem[]> {
    await mockDelay()
    mockLog('获取所有菜单')
    return [...mockMenus]
  }

  // 根据ID获取菜单
  static async getMenuById(menuId: number): Promise<MenuItem> {
    await mockDelay()
    mockLog('根据ID获取菜单', { menuId })

    const findMenuRecursive = (menus: MenuItem[], id: number): MenuItem | null => {
      for (const menu of menus) {
        if (menu.id === id) {
          return menu
        }
        if (menu.children) {
          const found = findMenuRecursive(menu.children, id)
          if (found) return found
        }
      }
      return null
    }

    const menu = findMenuRecursive(mockMenus, menuId)
    if (!menu) {
      throw new Error('菜单不存在')
    }

    return menu
  }

  // 创建菜单
  static async createMenu(menuData: Partial<MenuItem>): Promise<MenuItem> {
    await mockDelay()
    mockLog('创建菜单', menuData)

    const getAllMenuIds = (menus: MenuItem[]): number[] => {
      const ids: number[] = []
      menus.forEach(menu => {
        ids.push(Number(menu.id))
        if (menu.children) {
          ids.push(...getAllMenuIds(menu.children))
        }
      })
      return ids
    }

    const newMenu: MenuItem = {
      id: Math.max(...getAllMenuIds(mockMenus)) + 1,
      title: menuData.title || '',
      name: menuData.name || '',
      path: menuData.path || '',
      component: menuData.component,
      icon: menuData.icon,
      parentId: menuData.parentId,
      sort: menuData.sort || 0,
      type: menuData.type || 'menu',
      // hidden: menuData.hidden || false,
      // keepAlive: menuData.keepAlive || false,
      requiresAuth: menuData.requiresAuth !== false,
      permissions: menuData.permissions || [],
      link: menuData.link
    }

    // 如果有父级菜单，添加到父级的children中
    if (menuData.parentId) {
      const addToParent = (menus: MenuItem[]): boolean => {
        for (const menu of menus) {
          if (menu.id === menuData.parentId) {
            if (!menu.children) menu.children = []
            menu.children.push(newMenu)
            return true
          }
          if (menu.children && addToParent(menu.children)) {
            return true
          }
        }
        return false
      }
      addToParent(mockMenus)
    } else {
      // 顶级菜单
      mockMenus.push(newMenu)
    }

    return newMenu
  }

  // 更新菜单
  static async updateMenu(menuId: number, menuData: Partial<MenuItem>): Promise<MenuItem> {
    await mockDelay()
    mockLog('更新菜单', { menuId, menuData })

    const updateMenuRecursive = (menus: MenuItem[]): boolean => {
      for (let i = 0; i < menus.length; i++) {
        if (menus[i].id === menuId) {
          menus[i] = {
            ...menus[i],
            ...menuData,
            id: menuId,

          }
          return true
        }
        if (menus[i].children && updateMenuRecursive(menus[i].children!)) {
          return true
        }
      }
      return false
    }

    if (!updateMenuRecursive(mockMenus)) {
      throw new Error('菜单不存在')
    }

    // 返回更新后的菜单
    return await this.getMenuById(menuId)
  }

  // 删除菜单
  static async deleteMenu(menuId: number): Promise<boolean> {
    await mockDelay()
    mockLog('删除菜单', { menuId })

    const deleteMenuRecursive = (menus: MenuItem[]): boolean => {
      for (let i = 0; i < menus.length; i++) {
        if (menus[i].id === menuId) {
          menus.splice(i, 1)
          return true
        }
        if (menus[i].children && deleteMenuRecursive(menus[i].children!)) {
          return true
        }
      }
      return false
    }

    if (!deleteMenuRecursive(mockMenus)) {
      throw new Error('菜单不存在')
    }

    return true
  }
}
