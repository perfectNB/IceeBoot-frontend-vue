import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig, type AxiosRequestHeaders } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBaseURL } from './env'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import type { ApiResponse, ApiResponseLike, LoginResponse } from '@/types'

type RequestConfig = AxiosRequestConfig & {
  skipErrorMessage?: boolean
  _retry?: boolean
  _skipAuthRefresh?: boolean
}

type InternalRequestConfig = InternalAxiosRequestConfig & {
  skipErrorMessage?: boolean
  _retry?: boolean
  _skipAuthRefresh?: boolean
}

export const normalizeApiResponse = <T = Record<string, unknown>>(payload: ApiResponseLike<T>): ApiResponseLike<T> => {
  if (!payload || typeof payload !== 'object') {
    return payload
  }
  const normalized = { ...payload } as ApiResponseLike<T>
  if (normalized.data === undefined) {
    if (normalized.result !== undefined) {
      normalized.data = normalized.result
    } else if (normalized.success && typeof normalized.message === 'string') {
      normalized.data = normalized.message as unknown as T
    }
  }
  return normalized
}

// 创建axios实例
const service: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

const refreshService: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
})

const refreshThresholdMs = 60 * 1000
let refreshPromise: Promise<LoginResponse | null> | null = null
let logoutInProgress = false

const isAuthInvalidCode = (code?: number): boolean => {
  return code === 401 || code === 40101 || code === 40102
}

const isRefreshInvalidCode = (code?: number): boolean => {
  return code === 40101 || code === 40102
}

const triggerLogout = (message?: string) => {
  if (logoutInProgress) return
  logoutInProgress = true
  const userStore = useUserStore()
  userStore.logout()
  const finalize = () => {
    logoutInProgress = false
    router.push('/')
  }
  if (message) {
    ElMessageBox.alert(message, '提示', {
      confirmButtonText: '确定',
      type: 'warning'
    }).then(finalize).catch(finalize)
  } else {
    finalize()
  }
}

const refreshTokens = async (): Promise<LoginResponse | null> => {
  const userStore = useUserStore()
  const currentRefreshToken = userStore.getRefreshToken()
  if (!currentRefreshToken) {
    triggerLogout('登录已过期，请重新登录')
    return null
  }

  try {
    const response = await refreshService.post<ApiResponse<LoginResponse>>(
      '/api/v1/auth/refresh',
      { refreshToken: currentRefreshToken }
    )
    const normalized = normalizeApiResponse<LoginResponse>(response.data)
    const { code, success, data, message } = normalized
    if (success || code === 200 || code === 0) {
      if (data) {
        userStore.setAuthTokens(data)
        return data
      }
      return null
    }
    if (isRefreshInvalidCode(code)) {
      triggerLogout('登录已过期，请重新登录')
      return null
    }
    throw new Error(message || '刷新失败')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const responseData = error.response?.data as ApiResponseLike<LoginResponse> | undefined
      const normalized = responseData ? normalizeApiResponse<LoginResponse>(responseData) : undefined
      if (status === 401 || isRefreshInvalidCode(normalized?.code)) {
        triggerLogout('登录已过期，请重新登录')
        return null
      }
    }
    throw error
  }
}

const ensureFreshToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    const result = await refreshPromise
    return result?.accessToken || null
  }
  refreshPromise = refreshTokens()
  try {
    const result = await refreshPromise
    return result?.accessToken || null
  } finally {
    refreshPromise = null
  }
}

// 请求拦截器
service.interceptors.request.use(
  async (config) => {
    const requestConfig = config as InternalRequestConfig
    const userStore = useUserStore()
    const token = userStore.getToken()
    const tokenType = userStore.getTokenType() || 'Bearer'

    // 添加token到请求头
    if (token) {
      const headers = (requestConfig.headers || {}) as AxiosRequestHeaders
      headers.Authorization = `${tokenType} ${token}`
      requestConfig.headers = headers
    }

    if (!requestConfig._skipAuthRefresh) {
      const expires = userStore.getTokenExpires()
      const refreshToken = userStore.getRefreshToken()
      if (expires && expires - Date.now() <= refreshThresholdMs) {
        if (!refreshToken) {
          triggerLogout('登录已过期，请重新登录')
        } else {
          const newToken = await ensureFreshToken()
          if (newToken) {
            const nextTokenType = userStore.getTokenType() || 'Bearer'
            const headers = (requestConfig.headers || {}) as AxiosRequestHeaders
            headers.Authorization = `${nextTokenType} ${newToken}`
            requestConfig.headers = headers
          }
        }
      }
    }

    return requestConfig
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  async (response: AxiosResponse<ApiResponse<unknown>>) => {
    response.data = normalizeApiResponse(response.data) as ApiResponse<unknown>
    const { data } = response
    const { code, message, success } = data
    const config = response.config as InternalRequestConfig

    // 请求成功
    if (success || code === 200 || code === 0) {
      return response
    }

    if (!config._skipAuthRefresh && isAuthInvalidCode(code)) {
      if (!config._retry) {
        config._retry = true
        const newToken = await ensureFreshToken()
        if (newToken) {
          const userStore = useUserStore()
          const nextTokenType = userStore.getTokenType() || 'Bearer'
          const headers = (config.headers || {}) as AxiosRequestHeaders
          headers.Authorization = `${nextTokenType} ${newToken}`
          config.headers = headers
          return service.request(config)
        }
      }
      return Promise.reject(new Error(message || '登录已过期'))
    }

    // 权限不足
    if (code === 403) {
      const normalizedMessage = message || '权限不足'
      const skipErrorMessage = Boolean((response.config as RequestConfig | undefined)?.skipErrorMessage)
      if (!skipErrorMessage) {
        ElMessage.error(normalizedMessage)
      }
      return Promise.reject(new Error(normalizedMessage))
    }

    // 其他错误
    ElMessage.error(message || '请求失败')
    return Promise.reject(new Error(message || '请求失败'))
  },
  (error) => {
    console.error('响应错误:', error)

    let message = '网络错误'

    if (error.response) {
      const { status } = error.response
      const config = error.config as InternalRequestConfig | undefined
      if (status === 401 && config && !config._skipAuthRefresh && !config._retry) {
        config._retry = true
        return ensureFreshToken().then((newToken) => {
          if (newToken) {
            const userStore = useUserStore()
            const nextTokenType = userStore.getTokenType() || 'Bearer'
            const headers = (config.headers || {}) as AxiosRequestHeaders
            headers.Authorization = `${nextTokenType} ${newToken}`
            config.headers = headers
            return service.request(config)
          }
          triggerLogout('登录已过期，请重新登录')
          return Promise.reject(error)
        })
      }
      switch (status) {
        case 400:
          message = '请求参数错误'
          break
        case 401:
          message = '未授权，请重新登录'
          const userStore = useUserStore()
          userStore.logout()
          router.push('/')
          break
        case 403:
          message = '权限不足'
          break
        case 404:
          message = '请求的资源不存在'
          break
        case 500:
          message = '服务器内部错误'
          break
        case 502:
          message = '网关错误'
          break
        case 503:
          message = '服务不可用'
          break
        case 504:
          message = '网关超时'
          break
        default:
          message = `连接错误${status}`
      }
      const responseData = error.response?.data as ApiResponseLike<Record<string, unknown>> | undefined
      const normalized = responseData ? normalizeApiResponse(responseData) : undefined
      if (isRefreshInvalidCode(normalized?.code)) {
        triggerLogout('登录已过期，请重新登录')
      }
    } else if (error.request) {
      message = '网络连接异常'
    } else {
      message = error.message || '请求失败'
    }

    if (error && typeof error === 'object') {
      ;(error as Error).message = message
    }
    const skipErrorMessage = Boolean((error?.config as RequestConfig | undefined)?.skipErrorMessage)
    if (!skipErrorMessage) {
      ElMessage.error(message)
    }
    return Promise.reject(error)
  }
)

// 封装请求方法
const extractResponseData = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  const body = response.data as unknown as Record<string, unknown>
  if (body && typeof body === 'object' && 'data' in body) {
    return (body.data as T)
  }
  return response.data as unknown as T
}

export const request = {
  async get<T = Record<string, unknown>>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<T> {
    const response = await service.get<ApiResponse<T>>(url, { params, ...config })
    return extractResponseData(response)
  },

  async post<T = Record<string, unknown>>(
    url: string,
    data?: Record<string, unknown> | unknown[],
    config?: RequestConfig
  ): Promise<T> {
    const response = await service.post<ApiResponse<T>>(url, data, config)
    return extractResponseData(response)
  },

  async put<T = Record<string, unknown>>(
    url: string,
    data?: Record<string, unknown> | unknown[] | unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await service.put<ApiResponse<T>>(url, data, config)
    return extractResponseData(response)
  },

  async delete<T = Record<string, unknown>>(
    url: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<T> {
    const response = await service.delete<ApiResponse<T>>(url, { params, ...config })
    return extractResponseData(response)
  },

  async patch<T = Record<string, unknown>>(
    url: string,
    data?: Record<string, unknown> | unknown[] | unknown,
    config?: RequestConfig
  ): Promise<T> {
    const response = await service.patch<ApiResponse<T>>(url, data, config)
    return extractResponseData(response)
  }
}

export default service
