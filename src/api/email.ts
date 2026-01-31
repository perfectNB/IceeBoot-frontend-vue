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

export interface EmailAttachment {
  fileName?: string
  filePath?: string
  mimeType?: string
  fileSize?: number
  inline?: boolean
  contentId?: string
}

export interface EmailSendDTO {
  keyId?: number
  provider?: string
  toEmail?: string
  toEmails?: string[]
  ccEmails?: string[]
  bccEmails?: string[]
  subject?: string
  textContent?: string
  htmlContent?: string
  templateId?: string
  templateParams?: Record<string, unknown>
  fromName?: string
  emailType?: string
  priority?: number
  needReceipt?: boolean
  replyTo?: string
  charset?: string
  customHeaders?: Record<string, string>
  async?: boolean
  attachments?: EmailAttachment[]
}

export interface EmailStatusQuery {
  messageId?: string
  keyId?: number
  provider?: string
}

export interface EmailSendResult {
  toEmail?: string
  success?: boolean
  messageId?: string
  errorMessage?: string
  errorCode?: string
  status?: string
  sendTime?: string
}

export interface EmailResponse {
  success?: boolean
  errorMessage?: string
  errorCode?: string
  messageId?: string
  messageIds?: string[]
  fromEmail?: string
  toEmail?: string
  toEmails?: string[]
  subject?: string
  status?: string
  sendTime?: string
  provider?: string
  responseTime?: number
  emailSize?: number
  attachmentCount?: number
  extraData?: Record<string, unknown>
  rawResponse?: string
  requestId?: string
  responseCode?: number
  responseMessage?: string
  retryCount?: number
  sendResults?: EmailSendResult[]
}

// 获取Email服务商列表
export const getEmailProviders = async (): Promise<EmailProvider[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockEmailService.getEmailProviders()
  } else {
    // 调用真实API
    return await request.get<EmailProvider[]>('/api/v1/email-keys')
  }
}

// 获取Email服务商详情
export const getEmailProvider = async (providerName: string): Promise<EmailProvider> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockEmailService.getEmailProviders()
    const provider = providers.find(p => p.providerName === providerName)
    if (!provider) {
      throw new Error(`Email服务商 "${providerName}" 不存在`)
    }
    return provider
  } else {
    // 调用真实API
    return await request.get<EmailProvider>(`/api/v1/email-keys/${providerName}`)
  }
}

// 获取Email密钥列表
export const getEmailKeys = async (providerName: string): Promise<EmailKey[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const providers = await MockEmailService.getEmailProviders()
    const provider = providers.find(p => p.providerName === providerName)
    return provider?.keys || []
  } else {
    // 调用真实API - 从完整列表中筛选
    const response = await request.get<EmailProvider[]>('/api/v1/email-keys')
    const provider = response.find(p => p.providerName === providerName)
    return provider?.keys || []
  }
}

// 创建Email密钥
export const createEmailKey = async (data: Omit<EmailKey, 'id' | 'createTime'>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockEmailService.addEmailKey(data)
  } else {
    // 调用真实API
    await request.post('/api/v1/email-keys', data)
  }
}

// 更新Email密钥
export const updateEmailKey = async (emailProvider: string, keyId: number, data: Partial<EmailKey>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockEmailService.updateEmailKey(emailProvider, keyId, data)
  } else {
    // 调用真实API
    const requestData = { ...data, id: keyId }
    await request.put('/api/v1/email-keys', requestData)
  }
}

// 删除Email密钥（批量删除）
export const deleteEmailKeys = async (ids: number[]): Promise<boolean> => {
  if (isMockEnabled()) {
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
    await request.delete('/api/v1/email-keys', {}, {
      data: ids
    })
    return true
  }
}

// 删除单个Email密钥（兼容性保留）
export const deleteEmailKey = async (keyId: number): Promise<void> => {
  await deleteEmailKeys([keyId])
}

// 启用Email密钥
export const enableEmailKey = async (keyId: number): Promise<void> => {
  if (isMockEnabled()) {
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
    await request.put(`/api/v1/email-keys/${keyId}/enable`)
  }
}

// 禁用Email密钥
export const disableEmailKey = async (keyId: number): Promise<void> => {
  if (isMockEnabled()) {
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
    await request.put(`/api/v1/email-keys/${keyId}/disable`)
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

export const sendEmail = async (data: EmailSendDTO): Promise<EmailResponse> => {
  if (isMockEnabled()) {
    return {
      success: true,
      messageId: data.toEmail ? `mock-${Date.now()}` : undefined,
      messageIds: data.toEmails?.map((_, index) => `mock-${Date.now()}-${index}`),
      toEmail: data.toEmail,
      toEmails: data.toEmails,
      subject: data.subject,
      provider: data.provider,
      status: 'mock',
      sendTime: new Date().toLocaleString()
    }
  }
  return await request.post<EmailResponse>('/api/v1/emails/send', data as Record<string, unknown>)
}

export const queryEmailStatus = async (data: EmailStatusQuery): Promise<EmailResponse> => {
  if (isMockEnabled()) {
    return {
      success: true,
      messageId: data.messageId || `mock-${Date.now()}`,
      provider: data.provider,
      status: 'mock',
      sendTime: new Date().toLocaleString()
    }
  }
  return await request.post<EmailResponse>('/api/v1/emails/status', data as Record<string, unknown>)
}
