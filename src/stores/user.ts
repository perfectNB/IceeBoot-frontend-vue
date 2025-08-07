import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, LoginForm, LoginResponse } from '@/types'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>('')
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const roles = ref<string[]>([])

  // 获取token
  const getToken = (): string => {
    if (!token.value) {
      token.value = localStorage.getItem('accessToken') || ''
    }
    return token.value
  }

  // 设置token
  const setToken = (newToken: string): void => {
    token.value = newToken
    localStorage.setItem('accessToken', newToken)
  }

  // 清除token
  const clearToken = (): void => {
    token.value = ''
    localStorage.removeItem('accessToken')
  }

  // 设置用户信息
  const setUser = (userInfo: User): void => {
    user.value = userInfo
    permissions.value = userInfo.permissions || []
    roles.value = userInfo.roles || []
  }

  // 清除用户信息
  const clearUser = (): void => {
    user.value = null
    permissions.value = []
    roles.value = []
  }

  // 登录
  const login = async (loginForm: LoginForm): Promise<LoginResponse> => {
    try {
      // 模拟登录API调用
      if (loginForm.username === 'admin' && loginForm.password === '111111') {
        const mockResponse: LoginResponse = {
          accessToken: 'mock-token-' + Date.now(),
          user: {
            id: 1,
            username: 'admin',
            nickname: '管理员',
            avatar: '',
            email: 'admin@example.com',
            roles: ['admin'],
            permissions: ['*:*:*']
          }
        }
        
        setToken(mockResponse.accessToken)
        setUser(mockResponse.user)
        
        return mockResponse
      } else {
        throw new Error('用户名或密码错误')
      }
    } catch (error) {
      throw error
    }
  }

  // 登出
  const logout = (): void => {
    clearToken()
    clearUser()
  }

  // 获取用户信息
  const getUserInfo = async (): Promise<User> => {
    try {
      // 这里应该调用真实的API
      // const response = await request.get<User>('/user/info')
      // return response.data
      
      // 模拟数据
      const mockUser: User = {
        id: 1,
        username: 'admin',
        nickname: '管理员',
        avatar: '',
        email: 'admin@example.com',
        roles: ['admin'],
        permissions: ['*:*:*']
      }
      
      setUser(mockUser)
      return mockUser
    } catch (error) {
      throw error
    }
  }

  // 检查权限
  const hasPermission = (permission: string): boolean => {
    if (permissions.value.includes('*:*:*')) {
      return true
    }
    return permissions.value.includes(permission)
  }

  // 检查角色
  const hasRole = (role: string): boolean => {
    return roles.value.includes(role)
  }

  // 初始化时获取token
  token.value = getToken()

  return {
    token,
    user,
    permissions,
    roles,
    getToken,
    setToken,
    clearToken,
    setUser,
    clearUser,
    login,
    logout,
    getUserInfo,
    hasPermission,
    hasRole
  }
})