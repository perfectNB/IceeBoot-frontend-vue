import { isMockEnabled } from '@/config/mock'
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
  const refreshToken = ref<string>('')
  const tokenType = ref<string>('Bearer')
  const expires = ref<number | null>(null)

  type TokenStorage = 'local' | 'session' | 'memory'
  const prefix = isMockEnabled() ? 'demo:' : ''
  const TOKEN_KEY = prefix + 'accessToken'
  const REFRESH_TOKEN_KEY = prefix + 'refreshToken'
  const TOKEN_TYPE_KEY = prefix + 'tokenType'
  const EXPIRES_KEY = prefix + 'tokenExpires'
  const rawStorageType = import.meta.env.VITE_TOKEN_STORAGE as string | undefined
  const tokenStorageType: TokenStorage =
    rawStorageType === 'session' || rawStorageType === 'memory' ? rawStorageType : 'local'
  let memoryToken = ''
  let memoryRefreshToken = ''
  let memoryTokenType = 'Bearer'
  let memoryExpires: number | null = null

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

  const getRefreshToken = (): string => {
    if (!refreshToken.value) {
      if (tokenStorageType === 'memory') {
        refreshToken.value = memoryRefreshToken
      } else {
        refreshToken.value = safeGet(getStorage(), REFRESH_TOKEN_KEY)
      }
    }
    return refreshToken.value
  }

  const setRefreshToken = (newToken: string): void => {
    refreshToken.value = newToken
    if (tokenStorageType === 'memory') {
      memoryRefreshToken = newToken
    } else {
      safeSet(getStorage(), REFRESH_TOKEN_KEY, newToken)
    }
  }

  const getTokenType = (): string => {
    if (!tokenType.value) {
      if (tokenStorageType === 'memory') {
        tokenType.value = memoryTokenType
      } else {
        tokenType.value = safeGet(getStorage(), TOKEN_TYPE_KEY) || 'Bearer'
      }
    }
    return tokenType.value
  }

  const setTokenType = (newType: string): void => {
    tokenType.value = newType || 'Bearer'
    if (tokenStorageType === 'memory') {
      memoryTokenType = tokenType.value
    } else {
      safeSet(getStorage(), TOKEN_TYPE_KEY, tokenType.value)
    }
  }

  const getTokenExpires = (): number | null => {
    if (expires.value === null) {
      if (tokenStorageType === 'memory') {
        expires.value = memoryExpires
      } else {
        const raw = safeGet(getStorage(), EXPIRES_KEY)
        const parsed = Number(raw)
        expires.value = Number.isFinite(parsed) && parsed > 0 ? parsed : null
      }
    }
    return expires.value
  }

  const normalizeExpires = (value: number | null): number | null => {
    if (value === null) return null
    if (!Number.isFinite(value) || value <= 0) return null
    if (value < 1e10) {
      if (value < 1e9) {
        return Date.now() + value * 1000
      }
      return value * 1000
    }
    return value
  }

  const setTokenExpires = (value: number | null): void => {
    const normalized = normalizeExpires(value)
    expires.value = normalized
    if (tokenStorageType === 'memory') {
      memoryExpires = normalized
    } else if (normalized === null) {
      safeRemove(getStorage(), EXPIRES_KEY)
    } else {
      safeSet(getStorage(), EXPIRES_KEY, String(normalized))
    }
  }

  const setAuthTokens = (payload: LoginResponse): void => {
    if (payload.accessToken) {
      setToken(payload.accessToken)
    }
    if (payload.refreshToken) {
      setRefreshToken(payload.refreshToken)
    }
    if (payload.tokenType) {
      setTokenType(payload.tokenType)
    }
    if (payload.expires) {
      setTokenExpires(payload.expires)
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

  const clearAuthTokens = (): void => {
    clearToken()
    refreshToken.value = ''
    tokenType.value = 'Bearer'
    expires.value = null
    if (tokenStorageType === 'memory') {
      memoryRefreshToken = ''
      memoryTokenType = 'Bearer'
      memoryExpires = null
    } else {
      safeRemove(getStorage(), REFRESH_TOKEN_KEY)
      safeRemove(getStorage(), TOKEN_TYPE_KEY)
      safeRemove(getStorage(), EXPIRES_KEY)
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

      setAuthTokens(response)
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
    clearAuthTokens()
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
      const existingMenus = user.value?.menus
      const menus = existingMenus && existingMenus.length > 0 ? existingMenus : await getUserMenus()
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
  refreshToken.value = getRefreshToken()
  tokenType.value = getTokenType()
  expires.value = getTokenExpires()

  return {
    token,
    refreshToken,
    tokenType,
    expires,
    user,
    permissions,
    roles,
    getToken,
    setToken,
    clearToken,
    getRefreshToken,
    setRefreshToken,
    getTokenType,
    setTokenType,
    getTokenExpires,
    setTokenExpires,
    setAuthTokens,
    clearAuthTokens,
    setUser,
    clearUser,
    login,
    logout,
    getUserInfo,
    hasPermission,
    hasRole
  }
})
