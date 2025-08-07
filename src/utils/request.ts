import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getBaseURL } from './env'
import { useUserStore } from '@/stores/user'
import router from '@/router'
import type { ApiResponse } from '@/types'

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
    const token = userStore.token
    
    // 添加token到请求头
    if (token) {
      config.headers.accessToken = token
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
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    const { code, message, success } = data
    
    // 请求成功
    if (success || code === 200) {
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
        router.push('/login')
      })
      return Promise.reject(new Error(message || '登录已过期'))
    }
    
    // 权限不足
    if (code === 403) {
      ElMessage.error(message || '权限不足')
      return Promise.reject(new Error(message || '权限不足'))
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
          router.push('/login')
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
    
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// 封装请求方法
export const request = {
  async get<T = Record<string, unknown>>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await service.get(url, { params, ...config })
    return response.data
  },
  
  async post<T = Record<string, unknown>>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await service.post(url, data, config)
    return response.data
  },
  
  async put<T = Record<string, unknown>>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await service.put(url, data, config)
    return response.data
  },
  
  async delete<T = Record<string, unknown>>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await service.delete(url, { params, ...config })
    return response.data
  },
  
  async patch<T = Record<string, unknown>>(
    url: string,
    data?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await service.patch(url, data, config)
    return response.data
  }
}

export default service