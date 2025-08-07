import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockAuthService } from '@/mock/services'
import type { LoginForm, LoginResponse, User } from '@/types'

// 登录接口
export const login = async (data: LoginForm): Promise<LoginResponse> => {
  if (isMockEnabled()) {
    return await MockAuthService.login(data)
  } else {
    const response = await request.post<LoginResponse>('/auth/login', data as unknown as Record<string, unknown>)
    return response.data
  }
}

// 登出接口
export const logout = () => {
  return request.post('/auth/logout')
}

// 获取用户信息
export const getUserInfo = () => {
  return request.get<User>('/auth/user')
}

// 刷新token
export const refreshToken = (refreshToken: string) => {
  return request.post<{ accessToken: string }>('/auth/refresh', { refreshToken })
}

// 微信登录二维码
export const getWechatQrCode = () => {
  return request.get<{ qrCode: string; scene: string }>('/auth/wechat/qrcode')
}

// 检查微信登录状态
export const checkWechatLogin = (scene: string) => {
  return request.get<LoginResponse>(`/auth/wechat/check/${scene}`)
}