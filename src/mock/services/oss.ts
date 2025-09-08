import { ossProviders, ossKeys } from '../data/oss'
import type { OSSKey, OSSProvider } from '@/api/oss'

const mockOSSKeys = [...ossKeys]
let nextId = Math.max(...mockOSSKeys.map(k => k.id)) + 1

export class MockOSSService {
  // 获取OSS服务商列表
  static async getOSSProviders(): Promise<OSSProvider[]> {
    const providersWithKeys = ossProviders.map(provider => ({
      ...provider,
      keys: mockOSSKeys.filter(key => key.ossProvider === provider.providerName)
    }))
    return providersWithKeys
  }

  // 获取OSS服务商详情
  static async getOSSProvider(providerName: string): Promise<OSSProvider> {
    const provider = ossProviders.find(p => p.providerName === providerName)

    if (!provider) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    return {
      ...provider,
      keys: mockOSSKeys.filter(key => key.ossProvider === providerName)
    }
  }

  // 创建OSS服务商
  static async createOSSProvider(providerData: Partial<OSSProvider>): Promise<OSSProvider> {
    const newProvider: OSSProvider = {
      providerName: providerData.providerName || '',
      displayName: providerData.displayName || '',
      description: providerData.description || '',
      status: providerData.status || 'active',
      keys: []
    }

    ossProviders.push(newProvider)
    return { ...newProvider }
  }

  // 更新OSS服务商
  static async updateOSSProvider(providerName: string, providerData: Partial<OSSProvider>): Promise<OSSProvider> {
    const index = ossProviders.findIndex(p => p.providerName === providerName)

    if (index === -1) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    const updatedProvider = {
      ...ossProviders[index],
      ...providerData
    }

    ossProviders[index] = updatedProvider
    return { ...updatedProvider }
  }

  // 删除OSS服务商
  static async deleteOSSProvider(providerName: string): Promise<void> {
    const index = ossProviders.findIndex(p => p.providerName === providerName)

    if (index === -1) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    ossProviders.splice(index, 1)
  }

  // 添加OSS密钥
  static async addOSSKey(providerName: string, keyData: Partial<OSSKey>): Promise<OSSKey> {
    const provider = ossProviders.find(p => p.providerName === providerName)

    if (!provider) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    const newKey: OSSKey = {
      id: nextId++,
      ossProvider: providerName,
      accessKeyId: keyData.accessKeyId || '',
      accessKeySecret: keyData.accessKeySecret || '',
      endpoint: keyData.endpoint || '',
      defaultBucket: keyData.defaultBucket || '',
      region: keyData.region || '',
      customDomain: keyData.customDomain || '',
      remark: keyData.remark || '',
      status: keyData.status || 'active',
      extraConfig: keyData.extraConfig || '{}',
      createTime: new Date().toISOString()
    }

    mockOSSKeys.push(newKey)
    return { ...newKey }
  }

  // 删除OSS密钥
  static async deleteOSSKey(providerName: string, keyId: number): Promise<void> {
    const keyIndex = mockOSSKeys.findIndex(k => k.id === keyId && k.ossProvider === providerName)

    if (keyIndex === -1) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }

    mockOSSKeys.splice(keyIndex, 1)
  }

  // 更新OSS密钥
  static async updateOSSKey(providerName: string, keyId: number, data: Partial<OSSKey>): Promise<OSSKey> {
    const keyIndex = mockOSSKeys.findIndex(k => k.id === keyId && k.ossProvider === providerName)

    if (keyIndex === -1) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }

    const updatedKey = {
      ...mockOSSKeys[keyIndex],
      ...data,
      id: keyId,
      ossProvider: providerName
    }
    mockOSSKeys[keyIndex] = updatedKey
    return { ...updatedKey }
  }

  // 更新OSS服务商状态
  static async updateOSSProviderStatus(providerName: string, status: 'active' | 'inactive'): Promise<OSSProvider> {
    const provider = ossProviders.find(p => p.providerName === providerName)

    if (!provider) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }

    provider.status = status

    return { ...provider }
  }

  // 更新OSS密钥状态
  static async updateOSSKeyStatus(providerName: string, keyId: number, status: string): Promise<void> {
    const keyIndex = mockOSSKeys.findIndex(k => k.id === keyId && k.ossProvider === providerName)

    if (keyIndex === -1) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }

    mockOSSKeys[keyIndex].status = status as 'active' | 'inactive'
  }
}
