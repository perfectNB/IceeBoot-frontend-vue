import { request } from '@/utils/request'
import type { LoginForm, LoginResponse, User } from '@/types'

// 登录接口
export const login = (data: LoginForm): Promise<LoginResponse> => {
  // 模拟登录逻辑
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data.username === 'admin' && data.password === '111111') {
        resolve({
          accessToken: 'mock-token-' + Date.now(),
          user: {
            id: 1,
            username: 'admin',
            nickname: '管理员',
            avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
            email: 'admin@zboot.com',
            roles: ['admin'],
            permissions: ['*:*:*']
          }
        })
      } else {
        reject(new Error('用户名或密码错误'))
      }
    }, 1000)
  })
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