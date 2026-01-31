/**
 * SMS短信管理API
 */

import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import { MockSMSService } from '@/mock/services/sms'

// SMS密钥相关接口
export interface SMSKey {
  id: number
  smsProvider: string
  accessKeyId: string
  accessKeySecret: string
  endpoint?: string
  defaultSignName?: string
  defaultTemplateId?: string
  region?: string
  sender?: string
  remark?: string
  status: 'active' | 'inactive'
  extraConfig?: string
  createTime: string
}

export interface SMSProvider {
  providerName: string
  displayName: string
  description: string
  status: 'active' | 'inactive'
  keys?: SMSKey[]
}

 export interface SmsSendDTO {
  keyId?: number
  provider?: string
  phoneNumber?: string
  phoneNumbers?: string[]
  content?: string
  templateId?: string
  templateParams?: Record<string, string>
  signName?: string
  smsType?: string
  countryCode?: string
  scheduleTime?: number
  validityPeriod?: number
  callbackUrl?: string
  userData?: string
  sendType?: string
}

export interface SmsStatusQuery {
  messageId?: string
  keyId?: number
  provider?: string
}

export interface SmsBalanceQuery {
  keyId?: number
  provider?: string
}

export interface SmsResponse {
  success?: boolean
  errorMessage?: string
  errorCode?: string
  messageId?: string
  messageIds?: string[]
  phoneNumber?: string
  phoneNumbers?: string[]
  content?: string
  status?: string
  sendTime?: string
  provider?: string
  responseTime?: number
  cost?: string
  smsCount?: number
  extraData?: Record<string, unknown>
  rawResponse?: string
  requestId?: string
  serialNumber?: string
}

// 获取SMS服务商列表
export const getSMSProviders = async (): Promise<SMSProvider[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockSMSService.getSMSProviders()
  } else {
    // 调用真实API
    return await request.get<SMSProvider[]>('/api/v1/sms-keys')
  }
}

// 获取SMS服务商详情
export const getSMSProvider = async (providerName: string): Promise<SMSProvider> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockSMSService.getSMSProviders()
    const provider = providers.find(p => p.providerName === providerName)
    if (!provider) {
      throw new Error(`SMS服务商 "${providerName}" 不存在`)
    }
    return provider
  } else {
    // 调用真实API
    return await request.get<SMSProvider>(`/api/v1/sms-keys/${providerName}`)
  }
}

// 获取SMS密钥列表
export const getSMSKeys = async (providerName: string): Promise<SMSKey[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockSMSService.getSMSProviders()
    const provider = providers.find(p => p.providerName === providerName)
    return provider?.keys || []
  } else {
    // 调用真实API - 从完整列表中筛选
    const response = await request.get<SMSProvider[]>('/api/v1/sms-keys')
    const provider = response.find(p => p.providerName === providerName)
    return provider?.keys || []
  }
}

// 创建SMS密钥
export const createSMSKey = async (data: Omit<SMSKey, 'id' | 'createTime'>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockSMSService.addSMSKey(data)
  } else {
    // 调用真实API
    await request.post('/api/v1/sms-keys', data)
  }
}

// 更新SMS密钥
export const updateSMSKey = async (smsProvider: string, keyId: number, data: Partial<SMSKey>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockSMSService.updateSMSKey(smsProvider, keyId, data)
  } else {
    // 调用真实API
    const requestData = { ...data, id: keyId }
    await request.put('/api/v1/sms-keys', requestData)
  }
}

// 删除SMS密钥（批量删除）
export const deleteSMSKeys = async (ids: number[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    for (const keyId of ids) {
      const providers = await MockSMSService.getSMSProviders()
      const provider = providers.find(p => p.keys?.some((k: SMSKey) => k.id === keyId))
      if (provider) {
        await MockSMSService.deleteSMSKey(provider.providerName, keyId)
      } else {
        throw new Error(`SMS密钥 "${keyId}" 不存在`)
      }
    }
    return true
  } else {
    // 调用真实API
    await request.delete('/api/v1/sms-keys', {}, {
      data: ids
    })
    return true
  }
}

// 删除单个SMS密钥（兼容性保留）
export const deleteSMSKey = async (keyId: number): Promise<void> => {
  await deleteSMSKeys([keyId])
}

// 启用SMS密钥
export const enableSMSKey = async (keyId: number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    // 需要先找到对应的provider
    const providers = await MockSMSService.getSMSProviders()
    const provider = providers.find(p => p.keys?.some((k: SMSKey) => k.id === keyId))
    if (!provider) {
      throw new Error(`SMS密钥 "${keyId}" 不存在`)
    }
    await MockSMSService.updateSMSKey(provider.providerName, keyId, { status: 'active' })
  } else {
    // 调用真实API
    await request.put(`/api/v1/sms-keys/${keyId}/enable`)
  }
}

// 禁用SMS密钥
export const disableSMSKey = async (keyId: number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    // 需要先找到对应的provider
    const providers = await MockSMSService.getSMSProviders()
    const provider = providers.find(p => p.keys?.some((k: SMSKey) => k.id === keyId))
    if (!provider) {
      throw new Error(`SMS密钥 "${keyId}" 不存在`)
    }
    await MockSMSService.updateSMSKey(provider.providerName, keyId, { status: 'inactive' })
  } else {
    // 调用真实API
    await request.put(`/api/v1/sms-keys/${keyId}/disable`)
  }
}

// 兼容性函数 - 保持向后兼容
export const addSMSKey = createSMSKey
export const updateSMSKeyStatus = async (providerName: string, keyId: number, status: 'active' | 'inactive'): Promise<void> => {
  if (status === 'active') {
    await enableSMSKey(keyId)
  } else {
    await disableSMSKey(keyId)
  }
}

export const sendSms = async (data: SmsSendDTO): Promise<SmsResponse> => {
  if (isMockEnabled()) {
    return {
      success: true,
      messageId: data.phoneNumber ? `mock-${Date.now()}` : undefined,
      messageIds: data.phoneNumbers?.map((_, index) => `mock-${Date.now()}-${index}`),
      phoneNumber: data.phoneNumber,
      phoneNumbers: data.phoneNumbers,
      content: data.content,
      status: 'mock',
      provider: data.provider,
      sendTime: new Date().toLocaleString()
    }
  }
  return await request.post<SmsResponse>('/api/v1/sms/send', data as Record<string, unknown>)
}

export const querySmsStatus = async (data: SmsStatusQuery): Promise<SmsResponse> => {
  if (isMockEnabled()) {
    return {
      success: true,
      messageId: data.messageId || `mock-${Date.now()}`,
      provider: data.provider,
      status: 'mock',
      sendTime: new Date().toLocaleString()
    }
  }
  return await request.post<SmsResponse>('/api/v1/sms/status', data as Record<string, unknown>)
}

export const querySmsBalance = async (data: SmsBalanceQuery): Promise<SmsResponse> => {
  if (isMockEnabled()) {
    return {
      success: true,
      provider: data.provider,
      responseTime: 1,
      extraData: { balance: 'mock' }
    }
  }
  return await request.post<SmsResponse>('/api/v1/sms/balance', data as Record<string, unknown>)
}
