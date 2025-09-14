/**
 * Email邮件管理API
 */

import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockEmailService } from '@/mock/services/email'

// Email密钥相关接口
export interface EmailKey {
  id: number
  emailProvider: string
  emailAddress: string
  emailPassword: string
  smtpHost?: string
  smtpPort?: number
  enableSsl?: boolean
  enableTls?: boolean
  enableAuth?: boolean
  senderName?: string
  connectionTimeout?: number
  readTimeout?: number
  remark?: string
  status: 'active' | 'inactive'
  extraConfig?: string
  createTime: string
}

export interface EmailProvider {
  providerName: string
  displayName: string
  description: string
  status: 'active' | 'inactive'
  keys?: EmailKey[]
}

// 获取Email服务商列表
export const getEmailProviders = async (): Promise<EmailProvider[]> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    return await MockEmailService.getEmailProviders()
  } else {
    // 调用真实API
    const response = await request.get<{result: EmailProvider[]}>('/api/v1/email-keys')
    const apiResponse = response as unknown as {code: number, message: string, result: EmailProvider[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取Email服务商列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取Email服务商详情
export const getEmailProvider = async (providerName: string): Promise<EmailProvider> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockEmailService.getEmailProviders()
    const provider = providers.find(p => p.providerName === providerName)
    if (!provider) {
      throw new Error(`Email服务商 "${providerName}" 不存在`)
    }
    return provider
  } else {
    // 调用真实API
    const response = await request.get<{result: EmailProvider}>(`/api/v1/email-keys/${providerName}`)
    const apiResponse = response as unknown as {code: number, message: string, result: EmailProvider, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取Email服务商详情响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取Email密钥列表
export const getEmailKeys = async (providerName: string): Promise<EmailKey[]> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockEmailService.getEmailProviders()
    const provider = providers.find(p => p.providerName === providerName)
    return provider?.keys || []
  } else {
    // 调用真实API - 从完整列表中筛选
    const response = await request.get<{result: EmailProvider[]}>('/api/v1/email-keys')
    const apiResponse = response as unknown as {code: number, message: string, result: EmailProvider[], success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取密钥列表响应数据格式错误')
    }
    const provider = apiResponse.result.find(p => p.providerName === providerName)
    return provider?.keys || []
  }
}

// 创建Email密钥
export const createEmailKey = async (data: Omit<EmailKey, 'id' | 'createTime'>): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockEmailService.addEmailKey(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/email-keys', data)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建Email密钥失败')
    }
  }
}

// 更新Email密钥
export const updateEmailKey = async (emailProvider: string, keyId: number, data: Partial<EmailKey>): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    await MockEmailService.updateEmailKey(emailProvider, keyId, data)
  } else {
    // 调用真实API
    const requestData = { ...data, id: keyId }
    const response = await request.put('/api/v1/email-keys', requestData)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新Email密钥失败')
    }
  }
}

// 删除Email密钥（批量删除）
export const deleteEmailKeys = async (ids: number[]): Promise<boolean> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    for (const keyId of ids) {
      const providers = await MockEmailService.getEmailProviders()
      const provider = providers.find(p => p.keys?.some((k: EmailKey) => k.id === keyId))
      if (provider) {
        await MockEmailService.deleteEmailKey(provider.providerName, keyId)
      } else {
        throw new Error(`Email密钥 "${keyId}" 不存在`)
      }
    }
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/email-keys', {}, {
      data: ids
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除Email密钥失败')
    }
    return true
  }
}

// 删除单个Email密钥（兼容性保留）
export const deleteEmailKey = async (keyId: number): Promise<void> => {
  await deleteEmailKeys([keyId])
}

// 启用Email密钥
export const enableEmailKey = async (keyId: number): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    // 需要先找到对应的provider
    const providers = await MockEmailService.getEmailProviders()
    const provider = providers.find(p => p.keys?.some((k: EmailKey) => k.id === keyId))
    if (!provider) {
      throw new Error(`Email密钥 "${keyId}" 不存在`)
    }
    await MockEmailService.updateEmailKey(provider.providerName, keyId, { status: 'active' })
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/email-keys/${keyId}/enable`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('启用Email密钥失败')
    }
  }
}

// 禁用Email密钥
export const disableEmailKey = async (keyId: number): Promise<void> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    // 需要先找到对应的provider
    const providers = await MockEmailService.getEmailProviders()
    const provider = providers.find(p => p.keys?.some((k: EmailKey) => k.id === keyId))
    if (!provider) {
      throw new Error(`Email密钥 "${keyId}" 不存在`)
    }
    await MockEmailService.updateEmailKey(provider.providerName, keyId, { status: 'inactive' })
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/email-keys/${keyId}/disable`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('禁用Email密钥失败')
    }
  }
}

// 兼容性函数 - 保持向后兼容
export const addEmailKey = createEmailKey
export const updateEmailKeyStatus = async (providerName: string, keyId: number, status: 'active' | 'inactive'): Promise<void> => {
  if (status === 'active') {
    await enableEmailKey(keyId)
  } else {
    await disableEmailKey(keyId)
  }
}
