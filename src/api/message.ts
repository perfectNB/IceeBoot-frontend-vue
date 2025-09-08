import { request } from '@/utils/request'
import { isMockEnabled } from '@/config/mock'
import type { PageParams, PageResult } from '@/types'

// 消息类型
export type MessageType = 'system' | 'security' | 'task' | 'announcement' | 'reminder'

// 消息项接口
export interface MessageItem {
  id: number
  title: string
  content: string
  type: MessageType
  isRead: boolean
  userId: number
  createTime: string
  readTime?: string
}

// 消息查询参数
export interface MessageQueryParams extends PageParams {
  status?: 'read' | 'unread'
  type?: MessageType
  startTime?: string
  endTime?: string
}

// 获取消息列表
export const getMessages = async (params: MessageQueryParams): Promise<PageResult<MessageItem>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const { MockMessageService } = await import('@/mock/services/message')
    return await MockMessageService.getMessages(params)
  } else {
    // 调用真实API
    const response = await request.get('/api/v1/messages', { params })
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<MessageItem>, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('获取消息列表失败')
    }
    return apiResponse.result
  }
}

// 获取单个消息详情
export const getMessageById = async (id: number): Promise<MessageItem> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const { MockMessageService } = await import('@/mock/services/message')
    return await MockMessageService.getMessageById(id)
  } else {
    // 调用真实API
    const response = await request.get(`/api/v1/messages/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, result: MessageItem, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('获取消息详情失败')
    }
    return apiResponse.result
  }
}

// 标记消息为已读
export const markMessageAsRead = async (id: number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const { MockMessageService } = await import('@/mock/services/message')
    await MockMessageService.markAsRead(id)
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/messages/${id}/read`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('标记消息已读失败')
    }
  }
}

// 批量标记消息为已读
export const batchMarkAsRead = async (ids: number[]): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const { MockMessageService } = await import('@/mock/services/message')
    await MockMessageService.batchMarkAsRead(ids)
  } else {
    // 调用真实API
    const response = await request.put('/api/v1/messages/batch-read', { ids })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('批量标记已读失败')
    }
  }
}

// 删除消息
export const deleteMessage = async (id: number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const { MockMessageService } = await import('@/mock/services/message')
    await MockMessageService.deleteMessage(id)
  } else {
    // 调用真实API
    const response = await request.delete(`/api/v1/messages/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除消息失败')
    }
  }
}

// 批量删除消息
export const batchDeleteMessages = async (ids: number[]): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const { MockMessageService } = await import('@/mock/services/message')
    await MockMessageService.batchDeleteMessages(ids)
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/messages/batch', { data: { ids } })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('批量删除消息失败')
    }
  }
}

// 获取未读消息数量
export const getUnreadCount = async (): Promise<number> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const { MockMessageService } = await import('@/mock/services/message')
    return await MockMessageService.getUnreadCount()
  } else {
    // 调用真实API
    const response = await request.get('/api/v1/messages/unread-count')
    const apiResponse = response as unknown as {code: number, message: string, result: number, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('获取未读消息数量失败')
    }
    return apiResponse.result
  }
}

// 标记所有消息为已读
export const markAllAsRead = async (): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const { MockMessageService } = await import('@/mock/services/message')
    await MockMessageService.markAllAsRead()
  } else {
    // 调用真实API
    const response = await request.put('/api/v1/messages/mark-all-read')
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('标记所有消息已读失败')
    }
  }
}