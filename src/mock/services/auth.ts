/**
 * Mock认证服务
 */

import type { LoginForm, LoginResponse } from '@/types'
import { mockLoginUsers } from '../data/user'
import { mockLog, mockDelay } from '@/config/mock'

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
      tokenType:"Bearer",
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
