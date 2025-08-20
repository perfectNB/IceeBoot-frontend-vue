/**
 * AI对话API
 */

import { request } from '@/utils/request'
import type { ChatSession, ChatMessage, LLMModel, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockChatService } from '@/mock/services/chat'

// 获取对话会话列表
export const getChatSessions = async (params: PageParams): Promise<PageResult<ChatSession>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockChatService.getChatSessions(params)
  } else {
    // 调用真实API
    const response = await request.get<{result: PageResult<ChatSession>}>('/api/v1/ai/chat/sessions',  params )
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<ChatSession>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取聊天会话列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取对话会话详情
export const getChatSession = async (id: string | number): Promise<ChatSession> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockChatService.getChatSession(id)
  } else {
    // 调用真实API
    const response = await request.get<ChatSession>(`/api/v1/ai/chat/sessions/${id}`)
    return response.data
  }
}

// 创建对话会话
export const createChatSession = async (data: Partial<ChatSession>): Promise<ChatSession> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockChatService.createChatSession(data)
  } else {
    // 调用真实API
    const response = await request.post<ChatSession>('/api/v1/ai/chat/sessions', data)
    return response.data
  }
}

// 删除对话会话
export const deleteChatSession = async (id: string | number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockChatService.deleteChatSession(id)
  } else {
    // 调用真实API
    await request.delete(`/api/v1/ai/chat/sessions/${id}`)
  }
}

// 发送消息
export const sendMessage = async (sessionId: string | number, content: string): Promise<ChatMessage> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockChatService.sendMessage(sessionId, content)
  } else {
    // 调用真实API
    const response = await request.post<ChatMessage>(`/api/v1/ai/chat/sessions/${sessionId}/messages`, { content })
    return response.data
  }
}

// 获取可用的大模型列表
export const getAvailableModels = async (): Promise<LLMModel[]> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockChatService.getAvailableModels()
  } else {
    // 调用真实API
    const response = await request.get<LLMModel[]>('/api/v1/ai/chat/models')
    return response.data
  }
}

// 获取模型API配置
export const getModelApiConfig = async (modelName: string): Promise<{ baseUrl: string; endpoint: string; model: string } | null> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockChatService.getModelApiConfig(modelName)
  } else {
    // 调用真实API
    const response = await request.get<{ baseUrl: string; endpoint: string; model: string } | null>(`/api/v1/ai/chat/models/${modelName}/config`)
    return response.data
  }
}

// 流式对话（前端实现）
export const streamChat = async (
  sessionId: string | number,
  content: string,
  onMessage: (chunk: string) => void
): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockChatService.streamChat(sessionId, content, onMessage)
  } else {
    // 调用真实API - 这里需要根据实际的流式API实现
    // 示例：使用EventSource或fetch的stream模式
    const response = await fetch('/api/v1/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, content })
    })

    if (!response.body) {
      throw new Error('Stream not supported')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        onMessage(chunk)
      }
    } finally {
      reader.releaseLock()
    }
  }
}
