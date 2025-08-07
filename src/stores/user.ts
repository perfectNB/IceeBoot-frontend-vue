import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, LoginForm, LoginResponse } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockUserService } from '@/mock/services'
// import { login as apiLogin, getUserInfo as apiGetUserInfo } from '@/api/auth'

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
      let response: LoginResponse
      
      if (isMockEnabled()) {
        // 使用Mock数据
        response = await MockUserService.login(loginForm)
      } else {
        // 调用真实API
        // response = await apiLogin(loginForm)
        throw new Error('真实API未实现，请启用Mock模式')
      }
      
      setToken(response.accessToken)
      setUser(response.user)
      
      return response
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
      let userInfo: User
      
      if (isMockEnabled()) {
        // 使用Mock数据 - 获取当前登录用户信息
        const currentUserId = user.value?.id || 1
        userInfo = await MockUserService.getUserInfo(Number(currentUserId))
      } else {
        // 调用真实API
        // userInfo = await apiGetUserInfo()
        throw new Error('真实API未实现，请启用Mock模式')
      }
      
      setUser(userInfo)
      return userInfo
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