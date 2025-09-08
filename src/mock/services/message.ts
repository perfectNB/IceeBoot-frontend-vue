import type { MessageItem, MessageQueryParams, MessageType } from '@/api/message'
import type { PageResult } from '@/types'
import { mockMessages } from '@/mock/data/message'

// 消息Mock服务
export class MockMessageService {
  private static messages: MessageItem[] = [...mockMessages]

  // 获取消息列表
  static async getMessages(params: MessageQueryParams): Promise<PageResult<MessageItem>> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    let filteredMessages = [...this.messages]

    // 按状态筛选
    if (params.status) {
      if (params.status === 'read') {
        filteredMessages = filteredMessages.filter(msg => msg.isRead)
      } else if (params.status === 'unread') {
        filteredMessages = filteredMessages.filter(msg => !msg.isRead)
      }
    }

    // 按类型筛选
    if (params.type) {
      filteredMessages = filteredMessages.filter(msg => msg.type === params.type)
    }

    // 按时间范围筛选
    if (params.startTime) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.createTime) >= new Date(params.startTime!)
      )
    }
    if (params.endTime) {
      filteredMessages = filteredMessages.filter(msg => 
        new Date(msg.createTime) <= new Date(params.endTime!)
      )
    }

    // 按关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase()
      filteredMessages = filteredMessages.filter(msg => 
        msg.title.toLowerCase().includes(keyword) || 
        msg.content.toLowerCase().includes(keyword)
      )
    }

    // 分页处理
    const pageNum = params.pageNum || 1
    const pageSize = params.pageSize || 20
    const total = filteredMessages.length
    const startIndex = (pageNum - 1) * pageSize
    const endIndex = startIndex + pageSize
    const records = filteredMessages.slice(startIndex, endIndex)

    return {
      records,
      total,
      current: pageNum,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
      hasPrevious: pageNum > 1,
      hasNext: pageNum < Math.ceil(total / pageSize)
    }
  }

  // 获取单个消息详情
  static async getMessageById(id: number): Promise<MessageItem> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200))

    const message = this.messages.find(msg => msg.id === id)
    if (!message) {
      throw new Error(`消息 "${id}" 不存在`)
    }

    return { ...message }
  }

  // 标记消息为已读
  static async markAsRead(id: number): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200))

    const message = this.messages.find(msg => msg.id === id)
    if (!message) {
      throw new Error(`消息 "${id}" 不存在`)
    }

    if (!message.isRead) {
      message.isRead = true
      message.readTime = new Date().toISOString()
    }
  }

  // 批量标记消息为已读
  static async batchMarkAsRead(ids: number[]): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    for (const id of ids) {
      const message = this.messages.find(msg => msg.id === id)
      if (message && !message.isRead) {
        message.isRead = true
        message.readTime = new Date().toISOString()
      }
    }
  }

  // 删除消息
  static async deleteMessage(id: number): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200))

    const index = this.messages.findIndex(msg => msg.id === id)
    if (index === -1) {
      throw new Error(`消息 "${id}" 不存在`)
    }

    this.messages.splice(index, 1)
  }

  // 批量删除消息
  static async batchDeleteMessages(ids: number[]): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300))

    for (const id of ids) {
      const index = this.messages.findIndex(msg => msg.id === id)
      if (index !== -1) {
        this.messages.splice(index, 1)
      }
    }
  }

  // 获取未读消息数量
  static async getUnreadCount(): Promise<number> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100))

    return this.messages.filter(msg => !msg.isRead).length
  }

  // 标记所有消息为已读
  static async markAllAsRead(): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    const now = new Date().toISOString()
    this.messages.forEach(msg => {
      if (!msg.isRead) {
        msg.isRead = true
        msg.readTime = now
      }
    })
  }

  // 创建新消息（用于测试）
  static async createMessage(messageData: Omit<MessageItem, 'id' | 'createTime' | 'isRead' | 'readTime'>): Promise<MessageItem> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200))

    const newMessage: MessageItem = {
      ...messageData,
      id: Math.max(...this.messages.map(msg => msg.id)) + 1,
      createTime: new Date().toISOString(),
      isRead: false
    }

    this.messages.unshift(newMessage)
    return { ...newMessage }
  }

  // 重置消息数据（用于测试）
  static resetMessages(): void {
    this.messages = [...mockMessages]
  }

  // 获取消息统计信息
  static async getMessageStats(): Promise<{
    total: number
    unread: number
    read: number
    byType: Record<MessageType, number>
  }> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200))

    const total = this.messages.length
    const unread = this.messages.filter(msg => !msg.isRead).length
    const read = total - unread

    const byType: Record<MessageType, number> = {
      system: 0,
      security: 0,
      task: 0,
      announcement: 0,
      reminder: 0
    }

    this.messages.forEach(msg => {
      byType[msg.type]++
    })

    return {
      total,
      unread,
      read,
      byType
    }
  }
}