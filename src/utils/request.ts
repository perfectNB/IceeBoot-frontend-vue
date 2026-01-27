import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBaseURL } from './env'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import type { ApiResponse } from '@/types'

type ApiResponseLike<T = Record<string, unknown>> = {
  code?: number
  message?: string
  success?: boolean
  data?: T
  result?: T
}

type RequestConfig = AxiosRequestConfig & {
  skipErrorMessage?: boolean
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

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.getToken()

    // 添加token到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    response.data = normalizeApiResponse(response.data) as ApiResponse<unknown>
    const { data } = response
    const { code, message, success } = data

    // 请求成功
    if (success || code === 200 || code === 0) {
      return response
    }

    // 登录过期
    if (code === 401) {
      const userStore = useUserStore()
      userStore.logout()
      ElMessageBox.alert('登录已过期，请重新登录', '提示', {
        confirmButtonText: '确定',
        type: 'warning'
      }).then(() => {
        router.push('/')
      })
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
