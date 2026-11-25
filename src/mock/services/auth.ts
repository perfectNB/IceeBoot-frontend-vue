import type { LoginForm, LoginResponse, User } from '@/types'
import { useUserStore } from '@/stores/user'
import { mockLoginUsers, mockUsers } from '../data/user'
import { mockDelay } from '@/config/mock'

function userFromToken(token: string, kind: 'token' | 'refresh'): User {
  const match = new RegExp('^mock-' + kind + '-(\\d+)-\\d+$').exec(token)
  const user = match && mockUsers.find(row => Number(row.id) === Number(match[1]))
  if (!user || user.status === 'inactive') throw new Error('演示登录已失效')
  return user
}
export function demoUserId() {
  return Number(userFromToken(useUserStore().getToken(), 'token').id)
}
function tokens(user: User): LoginResponse {
  const suffix = user.id + '-' + Date.now()
  return { accessToken: 'mock-token-' + suffix, refreshToken: 'mock-refresh-' + suffix,
    user, tokenType: 'Bearer', expires: Date.now() + 24 * 60 * 60 * 1000 }
}

export const MockAuthService = {
  async login(form: LoginForm) {
    await mockDelay()
    const account = mockLoginUsers.find(row => row.username === form.username && row.password === form.password)
    const user = account && mockUsers.find(row => row.id === account.user.id)
    if (!user || user.status === 'inactive') throw new Error('用户名或密码错误')
    return tokens(user)
  },
  async logout() { return true },
  async refreshToken(token: string) { return tokens(userFromToken(token, 'refresh')) },
}
