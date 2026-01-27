import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { User, LoginForm, LoginResponse } from '@/types'
import { login as apiLogin, getUserInfo as apiGetUserInfo, getUserMenus } from '@/api'
import { resetDynamicRoutes } from '@/router'

export const useUserStore = defineStore('user', () => {
  // 状态
  const token = ref<string>('')
  const user = ref<User | null>(null)
  const permissions = ref<string[]>([])
  const roles = ref<string[]>([])

  type TokenStorage = 'local' | 'session' | 'memory'
  const TOKEN_KEY = 'accessToken'
  const rawStorageType = import.meta.env.VITE_TOKEN_STORAGE as string | undefined
  const tokenStorageType: TokenStorage =
    rawStorageType === 'session' || rawStorageType === 'memory' ? rawStorageType : 'local'
  let memoryToken = ''

  const getStorage = (): Storage | null => {
    if (tokenStorageType === 'session') return sessionStorage
    if (tokenStorageType === 'local') return localStorage
    return null
  }

  const safeGet = (storage: Storage | null, key: string): string => {
    if (!storage) return ''
    try {
      return storage.getItem(key) || ''
    } catch {
      return ''
    }
  }

  const safeSet = (storage: Storage | null, key: string, value: string): void => {
    if (!storage) return
    try {
      storage.setItem(key, value)
    } catch {
      return
    }
  }

  const safeRemove = (storage: Storage | null, key: string): void => {
    if (!storage) return
    try {
      storage.removeItem(key)
    } catch {
      return
    }
  }

  // 获取token
  const getToken = (): string => {
    if (!token.value) {
      if (tokenStorageType === 'memory') {
        token.value = memoryToken
      } else {
        token.value = safeGet(getStorage(), TOKEN_KEY)
      }
    }
    return token.value
  }

  // 设置token
  const setToken = (newToken: string): void => {
    token.value = newToken
    if (tokenStorageType === 'memory') {
      memoryToken = newToken
    } else {
      safeSet(getStorage(), TOKEN_KEY, newToken)
    }
  }

  // 清除token
  const clearToken = (): void => {
    token.value = ''
    if (tokenStorageType === 'memory') {
      memoryToken = ''
    } else {
      safeRemove(getStorage(), TOKEN_KEY)
    }
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
      // 统一使用 auth.ts 中的登录接口
      const response = await apiLogin(loginForm, { skipErrorMessage: true })

      setToken(response.accessToken)
      // 登录成功后，获取用户可见菜单并同步到用户信息中，供侧边栏使用
      const menus = await getUserMenus(undefined, { skipErrorMessage: true })
      setUser({ ...(response.user as User), menus } as User)

      return response
    } catch (error) {
      throw error
    }
  }

  // 登出
  const logout = (): void => {
    clearToken()
    clearUser()
    // 重置动态路由状态
    resetDynamicRoutes()
  }

  // 获取用户信息
  const getUserInfo = async (): Promise<User> => {
    try {
      // 统一使用 auth.ts 中的获取用户信息接口
      const userInfo = await apiGetUserInfo()
      // 获取并合并菜单到用户信息
      const menus = await getUserMenus()
      const mergedUser = { ...(userInfo as User), menus } as User
      setUser(mergedUser)
      return mergedUser
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
