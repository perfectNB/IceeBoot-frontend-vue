import { emailProviders, emailKeys } from '../data/email'
import type { EmailKey, EmailProvider } from '@/api/email'

const mockEmailKeys = [...emailKeys]
let nextId = Math.max(...mockEmailKeys.map(k => k.id)) + 1

export class MockEmailService {
  // 获取Email服务商列表
  static async getEmailProviders(): Promise<EmailProvider[]> {
    const providersWithKeys = emailProviders.map(provider => ({
      ...provider,
      keys: mockEmailKeys.filter(key => key.emailProvider === provider.providerName)
    }))
    return providersWithKeys
  }

  // 添加Email密钥
  static async addEmailKey(data: Partial<EmailKey>): Promise<EmailKey> {
    const newKey: EmailKey = {
      id: nextId++,
      emailProvider: data.emailProvider || '',
      emailAddress: data.emailAddress || '',
      emailPassword: data.emailPassword || '',
      smtpHost: data.smtpHost || '',
      smtpPort: data.smtpPort || 587,
      enableSsl: data.enableSsl !== undefined ? data.enableSsl : true,
      enableTls: data.enableTls !== undefined ? data.enableTls : false,
      enableAuth: data.enableAuth !== undefined ? data.enableAuth : true,
      senderName: data.senderName || '',
      connectionTimeout: data.connectionTimeout || 30000,
      readTimeout: data.readTimeout || 30000,
      remark: data.remark || '',
      status: data.status || 'active',
      extraConfig: data.extraConfig || '{}',
      createTime: new Date().toLocaleString()
    }
    mockEmailKeys.push(newKey)
    return newKey
  }

  // 更新Email密钥
  static async updateEmailKey(providerName: string, keyId: number, data: Partial<EmailKey>): Promise<EmailKey> {
    const keyIndex = mockEmailKeys.findIndex(k => k.id === keyId && k.emailProvider === providerName)
    
    if (keyIndex === -1) {
      throw new Error('密钥不存在')
    }

    const updatedKey = {
      ...mockEmailKeys[keyIndex],
      ...data,
      id: keyId,
      emailProvider: providerName
    }
    mockEmailKeys[keyIndex] = updatedKey
    return updatedKey
  }

  // 删除Email密钥
  static async deleteEmailKey(providerName: string, keyId: number): Promise<void> {
    const keyIndex = mockEmailKeys.findIndex(k => k.id === keyId && k.emailProvider === providerName)
    
    if (keyIndex === -1) {
      throw new Error('密钥不存在')
    }

    mockEmailKeys.splice(keyIndex, 1)
  }

  // 更新Email密钥状态
  static async updateEmailKeyStatus(providerName: string, keyId: number, status: string): Promise<void> {
    const keyIndex = mockEmailKeys.findIndex(k => k.id === keyId && k.emailProvider === providerName)
    
    if (keyIndex === -1) {
      throw new Error('密钥不存在')
    }

    mockEmailKeys[keyIndex].status = status as 'active' | 'inactive'
  }
}