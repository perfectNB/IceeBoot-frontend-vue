/**
 * Mock服务
 * 提供统一的Mock数据接口，模拟后端API响应
 */

import type { User, LoginForm, LoginResponse, MenuItem, ApiResponse, PageParams, PageResult, Role, Permission } from '@/types'
import { mockUsers, mockRoles, mockPermissions, mockMenus } from './data'
import { mockLoginUsers } from './data/user'
import { mockLog, mockDelay } from '@/config/mock'

// Mock认证服务
export class MockAuthService {
  // 用户登录
  static async login(loginForm: LoginForm): Promise<LoginResponse> {
    await mockDelay()
    mockLog('用户登录', loginForm)
    
    const loginUser = mockLoginUsers.find(u => u.username === loginForm.username && u.password === loginForm.password)
    if (!loginUser) {
      throw new Error('用户名或密码错误')
    }
    
    const response: LoginResponse = {
      accessToken: `mock-token-${loginUser.user.id}-${Date.now()}`,
      user: loginUser.user,
      expires: Date.now() + 24 * 60 * 60 * 1000 // 24小时
    }
    
    return response
  }
  
  // 登出
  static async logout(): Promise<boolean> {
    await mockDelay()
    mockLog('用户登出')
    return true
  }
  
  // 刷新token
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    await mockDelay()
    mockLog('刷新token', { refreshToken })
    return {
      accessToken: `mock-token-refresh-${Date.now()}`
    }
  }
}

// Mock用户服务
export class MockUserService {
  
  // 获取用户信息
  static async getUserInfo(userId: number): Promise<User> {
    await mockDelay()
    mockLog('获取用户信息', { userId })
    
    const user = mockUsers.find(u => u.id === userId)
    if (!user) {
      throw new Error('用户不存在')
    }
    
    return user
  }
  
  // 获取用户列表
  static async getUserList(params: PageParams): Promise<PageResult<User>> {
    await mockDelay()
    mockLog('获取用户列表', params)
    
    let filteredUsers = [...mockUsers]
    
    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredUsers = filteredUsers.filter(user => 
        user.username.toLowerCase().includes(keyword) ||
        user.nickname?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword)
      )
    }
    
    // 分页
    const total = filteredUsers.length
    const start = (params.page - 1) * params.size
    const end = start + params.size
    const list = filteredUsers.slice(start, end)
    
    return {
      list,
      total,
      page: params.page,
      size: params.size,
      pages: Math.ceil(total / params.size)
    }
  }
  
  // 创建用户
  static async createUser(userData: Partial<User>): Promise<User> {
    await mockDelay()
    mockLog('创建用户', userData)
    
    const newUser: User = {
      id: Math.max(...mockUsers.map(u => Number(u.id))) + 1,
      username: userData.username || '',
      nickname: userData.nickname,
      avatar: userData.avatar,
      email: userData.email,
      phone: userData.phone,
      roles: userData.roles || [],
      permissions: userData.permissions || [],
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    mockUsers.push(newUser)
    return newUser
  }
  
  // 更新用户
  static async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    await mockDelay()
    mockLog('更新用户', { userId, userData })
    
    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('用户不存在')
    }
    
    const updatedUser = {
      ...mockUsers[userIndex],
      ...userData,
      id: userId,
      updateTime: new Date().toISOString()
    }
    
    mockUsers[userIndex] = updatedUser
    return updatedUser
  }
  
  // 删除用户
  static async deleteUser(userId: number): Promise<boolean> {
    await mockDelay()
    mockLog('删除用户', { userId })
    
    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('用户不存在')
    }
    
    mockUsers.splice(userIndex, 1)
    return true
  }
}

// Mock角色服务
export class MockRoleService {
  // 获取角色列表
  static async getRoleList(params: PageParams): Promise<PageResult<Role>> {
    await mockDelay()
    mockLog('获取角色列表', params)
    
    let filteredRoles = [...mockRoles]
    
    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredRoles = filteredRoles.filter(role => 
        role.name.toLowerCase().includes(keyword) ||
        role.code.toLowerCase().includes(keyword) ||
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
  
  // 获取所有角色（用于下拉选择）
  static async getAllRoles(): Promise<Role[]> {
    await mockDelay()
    mockLog('获取所有角色')
    return [...mockRoles]
  }
  
  // 获取角色详情
  static async getRoleById(id: number): Promise<Role> {
    await mockDelay()
    mockLog('获取角色详情', { id })
    
    const role = mockRoles.find(r => r.id === id)
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
      description: roleData.description || '',
      permissions: roleData.permissions || [],
      status: roleData.status || 'active',
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
}

// Mock权限服务
export class MockPermissionService {
  // 获取权限列表
  static async getPermissionList(params: PageParams): Promise<PageResult<Permission>> {
    await mockDelay()
    mockLog('获取权限列表', params)
    
    let filteredPermissions = [...mockPermissions]
    
    // 关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredPermissions = filteredPermissions.filter(permission => 
        permission.name.toLowerCase().includes(keyword) ||
        permission.code.toLowerCase().includes(keyword) ||
        permission.description?.toLowerCase().includes(keyword)
      )
    }
    
    // 分页
    const total = filteredPermissions.length
    const start = (params.page - 1) * params.size
    const end = start + params.size
    const list = filteredPermissions.slice(start, end)
    
    return {
      list,
      total,
      page: params.page,
      size: params.size,
      pages: Math.ceil(total / params.size)
    }
  }
  
  // 获取权限树
  static async getPermissionTree(): Promise<Permission[]> {
    await mockDelay()
    mockLog('获取权限树')
    
    // 构建树形结构
    const buildTree = (permissions: Permission[], parentId: number | null = null): Permission[] => {
      return permissions
        .filter(p => p.parentId === parentId)
        .map(p => ({
          ...p,
          children: buildTree(permissions, Number(p.id))
        }))
    }
    
    return buildTree(mockPermissions)
  }
}

// Mock菜单服务
export class MockMenuService {
  // 获取用户菜单
  static async getUserMenus(userId: number): Promise<MenuItem[]> {
    await mockDelay()
    mockLog('获取用户菜单', { userId })
    
    // 根据用户权限过滤菜单（这里简化处理，实际应该根据用户权限过滤）
    return [...mockMenus]
  }
  
  // 获取所有菜单
  static async getAllMenus(): Promise<MenuItem[]> {
    await mockDelay()
    mockLog('获取所有菜单')
    return [...mockMenus]
  }
  
  // 创建菜单
  static async createMenu(menuData: Partial<MenuItem>): Promise<MenuItem> {
    await mockDelay()
    mockLog('创建菜单', menuData)
    
    const newMenu: MenuItem = {
      id: Math.max(...mockMenus.map(m => Number(m.id))) + 1,
      title: menuData.title || '',
      name: menuData.name || '',
      path: menuData.path || '',
      component: menuData.component,
      icon: menuData.icon,
      parentId: menuData.parentId,
      type: menuData.type || 'menu',
      sort: menuData.sort || 0,
      hidden: menuData.hidden,
      keepAlive: menuData.keepAlive,
      requiresAuth: menuData.requiresAuth,
      permissions: menuData.permissions,
      meta: menuData.meta || {
        title: menuData.title || '',
        icon: menuData.icon,
        requiresAuth: menuData.requiresAuth
      }
    }
    
    mockMenus.push(newMenu)
    return newMenu
  }
}

// 统一的Mock API响应包装器
export const mockApiResponse = <T>(data: T, message = '操作成功'): ApiResponse<T> => {
  return {
    code: 200,
    message,
    data,
    success: true,
    timestamp: Date.now()
  }
}