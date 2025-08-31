// AI对话Mock服务

import type { ChatSession, ChatMessage, LLMModel, PageParams, PageResult } from '@/types'
import { mockChatSessions, llmApiConfigs } from '../data/chat'
import { mockLLMModels } from '../data'

export class MockChatService {

  // 获取对话会话列表
  static getChatSessions(params: PageParams): PageResult<ChatSession> {
    const { pageNum = 1, pageSize = 20, keyword = '' } = params
    
    let filteredSessions = mockChatSessions
    
    // 关键词搜索
    if (keyword) {
      filteredSessions = mockChatSessions.filter(session => 
        session.title.toLowerCase().includes(keyword.toLowerCase()) ||
        session.modelName.toLowerCase().includes(keyword.toLowerCase())
      )
    }
    
    const total = filteredSessions.length
    const start = (pageNum - 1) * pageSize
    const end = start + pageSize
    const records = filteredSessions.slice(start, end)
    const pages = Math.ceil(total / pageSize)
    
    return {
      records,
      total,
      current: pageNum,
      size: pageSize,
      pages,
      hasPrevious: pageNum > 1,
      hasNext: pageNum < pages
    }
  }

  // 获取对话会话详情
  static getChatSession(id: string | number): ChatSession {
    const session = mockChatSessions.find(s => s.id === id)
    
    if (!session) {
      throw new Error(`对话会话不存在: ${id}`)
    }
    
    return session
  }

  // 创建对话会话
  static createChatSession(sessionData: Partial<ChatSession>): ChatSession {
    const newSession: ChatSession = {
      id: Date.now(),
      title: sessionData.title || '新对话',
      modelId: sessionData.modelId || '',
      modelName: sessionData.modelName || '',
      messages: [],
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    mockChatSessions.push(newSession)
    
    return newSession
  }

  // 删除对话会话
  static deleteChatSession(id: string | number): void {
    const index = mockChatSessions.findIndex(s => s.id === id)
    
    if (index === -1) {
      throw new Error(`对话会话不存在: ${id}`)
    }
    
    mockChatSessions.splice(index, 1)
  }

  // 发送消息
  static sendMessage(sessionId: string | number, content: string): ChatMessage {
    const session = mockChatSessions.find(s => s.id === sessionId)
    
    if (!session) {
      throw new Error(`对话会话不存在: ${sessionId}`)
    }
    
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    
    session.messages.push(userMessage)
    
    // 模拟AI回复
    const aiMessage: ChatMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: this.generateMockResponse(content),
      timestamp: new Date().toISOString()
    }
    
    session.messages.push(aiMessage)
    session.updateTime = new Date().toISOString()
    
    return aiMessage
  }

  // 获取可用的大模型列表
  static getAvailableModels(): LLMModel[] {
    // 只返回状态为active的模型
    return mockLLMModels.filter((model: LLMModel) => model.status === 'active')
  }

  // 获取模型API配置
  static getModelApiConfig(modelName: string): { baseUrl: string; endpoint: string; model: string } {
    const config = llmApiConfigs[modelName as keyof typeof llmApiConfigs]
    
    if (!config) {
      throw new Error(`模型配置不存在: ${modelName}`)
    }
    
    return config
  }

  // 流式对话（模拟）
  static streamChat(sessionId: string | number, content: string, onMessage: (chunk: string) => void): void {
    const session = mockChatSessions.find(s => s.id === sessionId)
    
    if (!session) {
      throw new Error(`对话会话不存在: ${sessionId}`)
    }
    
    // 添加用户消息
    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }
    
    session.messages.push(userMessage)
    
    // 模拟流式响应
    const response = this.generateMockResponse(content)
    const chunks = response.split('')
    
    for (let i = 0; i < chunks.length; i++) {
      setTimeout(() => {
        onMessage(chunks[i])
        
        // 最后一个chunk时保存完整消息
        if (i === chunks.length - 1) {
          const aiMessage: ChatMessage = {
            id: Date.now() + 1,
            role: 'assistant',
            content: response,
            timestamp: new Date().toISOString()
          }
          
          session.messages.push(aiMessage)
          session.updateTime = new Date().toISOString()
        }
      }, i * 50) // 每50ms发送一个字符
    }
  }

  // 生成模拟回复
  private static generateMockResponse(userInput: string): string {
    const responses = [
      `我理解您的问题："${userInput}"。这是一个很好的问题，让我来为您详细解答。`,
      `关于"${userInput}"这个话题，我可以从以下几个方面来分析：\n\n1. 首先，我们需要了解基本概念\n2. 其次，分析具体的应用场景\n3. 最后，提供一些实用的建议`,
      `您提到的"${userInput}"确实是一个值得深入探讨的问题。基于我的知识，我认为可以这样理解...`,
      `这是一个非常有趣的问题！关于"${userInput}"，我想分享一些见解和建议。`,
      `感谢您的提问。对于"${userInput}"这个问题，我建议我们可以从多个角度来思考和分析。`
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }
}