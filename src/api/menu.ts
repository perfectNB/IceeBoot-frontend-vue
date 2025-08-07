import { request } from '@/utils/request'
import type { MenuItem } from '@/types'

// 获取用户菜单
export const getUserMenus = (): Promise<MenuItem[]> => {
  // 模拟菜单数据
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockMenus: MenuItem[] = [
        {
          id: 1,
          title: '工作台',
          name: 'Dashboard',
          path: '/admin/dashboard',
          icon: 'Monitor',
          type: 'menu',
          sort: 1,
          requiresAuth: true,
          meta: {
            title: '工作台',
            icon: 'Monitor',
            requiresAuth: true
          }
        },
        {
          id: 2,
          title: '系统管理',
          name: 'System',
          path: '/admin/system',
          icon: 'Setting',
          type: 'menu',
          sort: 2,
          requiresAuth: true,
          meta: {
            title: '系统管理',
            icon: 'Setting',
            requiresAuth: true
          },
          children: [
            {
              id: 21,
              title: '用户管理',
              name: 'UserManagement',
              path: '/admin/system/user',
              icon: 'User',
              parentId: 2,
              type: 'menu',
              sort: 1,
              requiresAuth: true,
              meta: {
                title: '用户管理',
                icon: 'User',
                requiresAuth: true
              }
            },
            {
              id: 22,
              title: '角色管理',
              name: 'RoleManagement',
              path: '/admin/system/role',
              icon: 'UserFilled',
              parentId: 2,
              type: 'menu',
              sort: 2,
              requiresAuth: true,
              meta: {
                title: '角色管理',
                icon: 'UserFilled',
                requiresAuth: true
              }
            },
            {
              id: 23,
              title: '权限管理',
              name: 'PermissionManagement',
              path: '/admin/system/permission',
              icon: 'Key',
              parentId: 2,
              type: 'menu',
              sort: 3,
              requiresAuth: true,
              meta: {
                title: '权限管理',
                icon: 'Key',
                requiresAuth: true
              }
            },
            {
              id: 24,
              title: '菜单管理',
              name: 'MenuManagement',
              path: '/admin/system/menu',
              icon: 'Menu',
              parentId: 2,
              type: 'menu',
              sort: 4,
              requiresAuth: true,
              meta: {
                title: '菜单管理',
                icon: 'Menu',
                requiresAuth: true
              }
            }
          ]
        },
        {
          id: 3,
          title: '内容管理',
          name: 'Content',
          path: '/admin/content',
          icon: 'Document',
          type: 'menu',
          sort: 3,
          requiresAuth: true,
          meta: {
            title: '内容管理',
            icon: 'Document',
            requiresAuth: true
          },
          children: [
            {
              id: 31,
              title: '文章管理',
              name: 'ArticleManagement',
              path: '/admin/content/article',
              icon: 'EditPen',
              parentId: 3,
              type: 'menu',
              sort: 1,
              requiresAuth: true,
              meta: {
                title: '文章管理',
                icon: 'EditPen',
                requiresAuth: true
              },
              children: [
                {
                  id: 311,
                  title: '文章列表',
                  name: 'ArticleList',
                  path: '/admin/content/article/list',
                  icon: 'List',
                  parentId: 31,
                  type: 'menu',
                  sort: 1,
                  requiresAuth: true,
                  meta: {
                    title: '文章列表',
                    icon: 'List',
                    requiresAuth: true
                  }
                },
                {
                  id: 312,
                  title: '文章分类',
                  name: 'ArticleCategory',
                  path: '/admin/content/article/category',
                  icon: 'Collection',
                  parentId: 31,
                  type: 'menu',
                  sort: 2,
                  requiresAuth: true,
                  meta: {
                    title: '文章分类',
                    icon: 'Collection',
                    requiresAuth: true
                  }
                },
                {
                  id: 313,
                  title: '文章标签',
                  name: 'ArticleTag',
                  path: '/admin/content/article/tag',
                  icon: 'PriceTag',
                  parentId: 31,
                  type: 'menu',
                  sort: 3,
                  requiresAuth: true,
                  meta: {
                    title: '文章标签',
                    icon: 'PriceTag',
                    requiresAuth: true
                  }
                }
              ]
            },
            {
              id: 32,
              title: '媒体管理',
              name: 'MediaManagement',
              path: '/admin/content/media',
              icon: 'Picture',
              parentId: 3,
              type: 'menu',
              sort: 2,
              requiresAuth: true,
              meta: {
                title: '媒体管理',
                icon: 'Picture',
                requiresAuth: true
              }
            }
          ]
        },
        {
          id: 4,
          title: '数据统计',
          name: 'Statistics',
          path: '/admin/statistics',
          icon: 'DataAnalysis',
          type: 'menu',
          sort: 4,
          requiresAuth: true,
          meta: {
            title: '数据统计',
            icon: 'DataAnalysis',
            requiresAuth: true
          },
          children: [
            {
              id: 41,
              title: '访问统计',
              name: 'VisitStatistics',
              path: '/admin/statistics/visit',
              icon: 'TrendCharts',
              parentId: 4,
              type: 'menu',
              sort: 1,
              requiresAuth: true,
              meta: {
                title: '访问统计',
                icon: 'TrendCharts',
                requiresAuth: true
              }
            },
            {
              id: 42,
              title: '用户统计',
              name: 'UserStatistics',
              path: '/admin/statistics/user',
              icon: 'Avatar',
              parentId: 4,
              type: 'menu',
              sort: 2,
              requiresAuth: true,
              meta: {
                title: '用户统计',
                icon: 'Avatar',
                requiresAuth: true
              }
            }
          ]
        },
        {
          id: 5,
          title: '工具箱',
          name: 'Tools',
          path: '/admin/tools',
          icon: 'Tools',
          type: 'menu',
          sort: 5,
          requiresAuth: true,
          meta: {
            title: '工具箱',
            icon: 'Tools',
            requiresAuth: true
          },
          children: [
            {
              id: 51,
              title: '代码生成',
              name: 'CodeGenerator',
              path: '/admin/tools/generator',
              icon: 'Cpu',
              parentId: 5,
              type: 'menu',
              sort: 1,
              requiresAuth: true,
              meta: {
                title: '代码生成',
                icon: 'Cpu',
                requiresAuth: true
              }
            },
            {
              id: 52,
              title: '接口文档',
              name: 'ApiDoc',
              path: '/admin/tools/api-doc',
              icon: 'Document',
              parentId: 5,
              type: 'menu',
              sort: 2,
              requiresAuth: true,
              meta: {
                title: '接口文档',
                icon: 'Document',
                requiresAuth: true
              }
            },
            {
              id: 53,
              title: '系统监控',
              name: 'SystemMonitor',
              path: '/admin/tools/monitor',
              icon: 'Monitor',
              parentId: 5,
              type: 'menu',
              sort: 3,
              requiresAuth: true,
              meta: {
                title: '系统监控',
                icon: 'Monitor',
                requiresAuth: true
              }
            }
          ]
        }
      ]
      resolve(mockMenus)
    }, 500)
  })
}

// 获取所有菜单（管理用）
export const getAllMenus = () => {
  return request.get<MenuItem[]>('/menu/all')
}

// 创建菜单
export const createMenu = (data: Partial<MenuItem>) => {
  return request.post('/menu', data)
}

// 更新菜单
export const updateMenu = (id: string | number, data: Partial<MenuItem>) => {
  return request.put(`/menu/${id}`, data)
}

// 删除菜单
export const deleteMenu = (id: string | number) => {
  return request.delete(`/menu/${id}`)
}