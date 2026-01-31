import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockAuthService } from '@/mock/services/auth'
import { MockUserService } from '@/mock/services/user'
import type { LoginForm, LoginResponse, User } from '@/types'
import type { AxiosRequestConfig } from 'axios'

// 登录接口
export const login = async (data: LoginForm, config?: AxiosRequestConfig & { skipErrorMessage?: boolean }): Promise<LoginResponse> => {
  if (isMockEnabled()) {
    return await MockAuthService.login(data)
  } else {
    return await request.post<LoginResponse>('/api/v1/auth/login', data as unknown as Record<string, unknown>, config)
  }

}

// 登出接口
export const logout = () => {
  if (isMockEnabled()) {
    // Mock模式：直接返回成功响应，不调用真实接口
    return Promise.resolve({ success: true, message: '退出登录成功' })
  } else {
    return request.post('/api/v1/auth/logout')
  }
}

// 获取用户信息
export const getUserInfo = async (): Promise<User> => {
  if (isMockEnabled()) {
    // Mock模式：获取当前登录用户信息
    // 从token中解析用户ID（简化处理，实际应该从token中解析）
    const userId = 1 // 默认管理员用户
    const userInfo = await MockUserService.getUserInfo(userId)
    return userInfo
  } else {
    return await request.get<User>('/api/v1/auth/user')
  }
}

// 刷新token
export const refreshToken = (refreshToken: string, config?: AxiosRequestConfig & { skipErrorMessage?: boolean }) => {
  return request.post<LoginResponse>('/api/v1/auth/refresh', { refreshToken }, config)
}

// 微信登录二维码
export const getWechatQrCode = () => {
  return request.get<{ qrCode: string; scene: string }>('/api/v1/auth/wechat/qrcode')
}

// 检查微信登录状态
export const checkWechatLogin = (scene: string) => {
  return request.get<LoginResponse>(`/api/v1/auth/wechat/check/${scene}`)
}
