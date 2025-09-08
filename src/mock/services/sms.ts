import { smsProviders, smsKeys } from '../data/sms'
import type { SMSKey, SMSProvider } from '@/api/sms'

const mockSMSKeys = [...smsKeys]
let nextId = Math.max(...mockSMSKeys.map(k => k.id)) + 1

export class MockSMSService {
  // 获取SMS服务商列表
  static async getSMSProviders(): Promise<SMSProvider[]> {
    const providersWithKeys = smsProviders.map(provider => ({
      ...provider,
      keys: mockSMSKeys.filter(key => key.smsProvider === provider.providerName)
    }))
    return providersWithKeys
  }

  // 添加SMS密钥
  static async addSMSKey(data: Partial<SMSKey>): Promise<SMSKey> {
    const newKey: SMSKey = {
      id: nextId++,
      smsProvider: data.smsProvider || '',
      accessKeyId: data.accessKeyId || '',
      accessKeySecret: data.accessKeySecret || '',
      endpoint: data.endpoint || '',
      defaultSignName: data.defaultSignName || '',
      defaultTemplateId: data.defaultTemplateId || '',
      region: data.region || '',
      sender: data.sender || '',
      remark: data.remark || '',
      status: data.status || 'active',
      extraConfig: data.extraConfig || '{}',
      createTime: new Date().toLocaleString()
    }
    mockSMSKeys.push(newKey)
    return newKey
  }

  // 更新SMS密钥
  static async updateSMSKey(providerName: string, keyId: number, data: Partial<SMSKey>): Promise<SMSKey> {
    const keyIndex = mockSMSKeys.findIndex(k => k.id === keyId && k.smsProvider === providerName)
    
    if (keyIndex === -1) {
      throw new Error('密钥不存在')
    }

    const updatedKey = {
      ...mockSMSKeys[keyIndex],
      ...data,
      id: keyId,
      smsProvider: providerName
    }
    mockSMSKeys[keyIndex] = updatedKey
    return updatedKey
  }

  // 删除SMS密钥
  static async deleteSMSKey(providerName: string, keyId: number): Promise<void> {
    const keyIndex = mockSMSKeys.findIndex(k => k.id === keyId && k.smsProvider === providerName)
    
    if (keyIndex === -1) {
      throw new Error('密钥不存在')
    }

    mockSMSKeys.splice(keyIndex, 1)
  }

  // 更新SMS密钥状态
  static async updateSMSKeyStatus(providerName: string, keyId: number, status: string): Promise<void> {
    const keyIndex = mockSMSKeys.findIndex(k => k.id === keyId && k.smsProvider === providerName)
    
    if (keyIndex === -1) {
      throw new Error('密钥不存在')
    }

    mockSMSKeys[keyIndex].status = status as 'active' | 'inactive'
  }
}