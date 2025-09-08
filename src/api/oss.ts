/**
 * OSS存储管理API
 */

import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockOSSService } from '@/mock/services/oss'

// OSS密钥相关接口
export interface OSSKey {
  id: number
  ossProvider: string
  accessKeyId: string
  accessKeySecret: string
  endpoint?: string
  defaultBucket?: string
  region?: string
  customDomain?: string
  remark?: string
  status: 'active' | 'inactive'
  extraConfig?: string
  createTime: string
}

export interface OSSProvider {
  providerName: string
  displayName: string
  description: string
  status: 'active' | 'inactive'
  keys?: OSSKey[]
}

// 获取OSS服务商列表
export const getOSSProviders = async (): Promise<OSSProvider[]> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockOSSService.getOSSProviders()
  } else {
    // 调用真实API
    const response = await request.get<{result: OSSProvider[]}>('/api/v1/oss-keys')
    const apiResponse = response as unknown as {code: number, message: string, result: OSSProvider[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取OSS服务商列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取OSS服务商详情
export const getOSSProvider = async (providerName: string): Promise<OSSProvider> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockOSSService.getOSSProviders()
    const provider = providers.find(p => p.providerName === providerName)
    if (!provider) {
      throw new Error(`OSS服务商 "${providerName}" 不存在`)
    }
    return provider
  } else {
    // 调用真实API
    const response = await request.get<{result: OSSProvider}>(`/api/v1/oss-keys/providers/${providerName}`)
    const apiResponse = response as unknown as {code: number, message: string, result: OSSProvider, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取OSS服务商详情响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取OSS密钥列表
export const getOSSKeys = async (providerName: string): Promise<OSSKey[]> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockOSSService.getOSSProviders()
    const provider = providers.find(p => p.providerName === providerName)
    return provider?.keys || []
  } else {
    // 调用真实API - 从完整列表中筛选
    const response = await request.get<{result: OSSProvider[]}>('/api/v1/oss-keys/providers')
    const apiResponse = response as unknown as {code: number, message: string, result: OSSProvider[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取密钥列表响应数据格式错误')
    }
    const provider = apiResponse.result.find(p => p.providerName === providerName)
    return provider?.keys || []
  }
}

// 创建OSS密钥
export const createOSSKey = async (data: Omit<OSSKey, 'id' | 'createTime'>): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockOSSService.addOSSKey(data.ossProvider || '', data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/oss-keys', data)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建OSS密钥失败')
    }
  }
}

// 更新OSS密钥
export const updateOSSKey = async (ossProvider: string, keyId: number, data: Partial<OSSKey>): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockOSSService.updateOSSKey(ossProvider, keyId, data)
  } else {
    // 调用真实API
    const requestData = { ...data, id: keyId }
    const response = await request.put('/api/v1/oss-keys', requestData)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新OSS密钥失败')
    }
  }
}

// 删除OSS密钥（批量删除）
export const deleteOSSKeys = async (ids: number[]): Promise<boolean> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    for (const keyId of ids) {
      const providers = await MockOSSService.getOSSProviders()
      const provider = providers.find(p => p.keys?.some((k: OSSKey) => k.id === keyId))
      if (provider) {
        await MockOSSService.deleteOSSKey(provider.providerName, keyId)
      } else {
        throw new Error(`OSS密钥 "${keyId}" 不存在`)
      }
    }
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/oss-keys', {}, {
      data: ids
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除OSS密钥失败')
    }
    return true
  }
}

// 删除单个OSS密钥（兼容性保留）
export const deleteOSSKey = async (keyId: number): Promise<void> => {
  await deleteOSSKeys([keyId])
}

// 启用OSS密钥
export const enableOSSKey = async (keyId: number): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    // 需要先找到对应的provider
    const providers = await MockOSSService.getOSSProviders()
    const provider = providers.find(p => p.keys?.some((k: OSSKey) => k.id === keyId))
    if (!provider) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }
    await MockOSSService.updateOSSKey(provider.providerName, keyId, { status: 'active' })
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/oss-keys/${keyId}/enable`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('启用OSS密钥失败')
    }
  }
}

// 禁用OSS密钥
export const disableOSSKey = async (keyId: number): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    // 需要先找到对应的provider
    const providers = await MockOSSService.getOSSProviders()
    const provider = providers.find(p => p.keys?.some((k: OSSKey) => k.id === keyId))
    if (!provider) {
      throw new Error(`OSS密钥 "${keyId}" 不存在`)
    }
    await MockOSSService.updateOSSKey(provider.providerName, keyId, { status: 'inactive' })
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/oss-keys/${keyId}/disable`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('禁用OSS密钥失败')
    }
  }
}

// 兼容性函数 - 保持向后兼容
export const addOSSKey = createOSSKey
export const updateOSSKeyStatus = async (providerName: string, keyId: number, status: 'active' | 'inactive'): Promise<void> => {
  if (status === 'active') {
    await enableOSSKey(keyId)
  } else {
    await disableOSSKey(keyId)
  }
}
