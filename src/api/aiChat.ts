/**
 * AI对话API
 */

import { request } from '@/utils/request'
import type { PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockChatService } from '@/mock/services/chat'
import { getBaseURL } from '@/utils/env'

// AI聊天会话接口
export interface AiChatSession {
  id: number
  title: string
  modelId: number
  modelName: string
  userId: number
  createTime: string
  updateTime: string
  messages?: AiChatMessage[]
}

// AI聊天消息接口
export interface AiChatMessage {
  id: number
  sessionId: number
  role: string
  content: string
  timestamp: string
  userId: number
  createTime: string
  updateTime: string
}

// 创建会话请求参数
export interface CreateSessionParams {
  title: string
  keyId: number
  modelName: string
}

// 流式对话请求参数
export interface StreamChatRequest {
  sessionId: number
  content: string
}

// 获取对话会话列表
export const getAiChatSessions = async (params: PageParams): Promise<PageResult<AiChatSession>> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    const mockResult = await MockChatService.getChatSessions(params)
    // 转换ChatSession到AiChatSession格式
    const convertedRecords = mockResult.records.map(session => ({
      id: typeof session.id === 'string' ? parseInt(session.id) : session.id,
      title: session.title,
      modelId: 1,
      modelName: session.modelName,
      userId: 1,
      createTime: session.createTime,
      updateTime: session.updateTime,
      messages: session.messages?.map(msg => ({
        id: typeof msg.id === 'string' ? parseInt(msg.id) : msg.id,
        sessionId: typeof session.id === 'string' ? parseInt(session.id) : session.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        userId: 1,
        createTime: msg.timestamp,
        updateTime: msg.timestamp
      })) || []
    }))
    return {
      ...mockResult,
      records: convertedRecords
    }
  } else {
    // 调用真实API
    const response = await request.get<{result: PageResult<AiChatSession>}>('/api/v1/chat/sessions', params)
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<AiChatSession>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取AI聊天会话列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 创建对话会话
export const createAiChatSession = async (data: CreateSessionParams): Promise<AiChatSession> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    const mockSession = await MockChatService.createChatSession({
      title: data.title,
      modelName: data.modelName
    })
    // 转换ChatSession到AiChatSession格式
    return {
      id: typeof mockSession.id === 'string' ? parseInt(mockSession.id) : mockSession.id,
      title: mockSession.title,
      modelId: 1,
      modelName: mockSession.modelName,
      userId: 1,
      createTime: mockSession.createTime,
      updateTime: mockSession.updateTime,
      messages: mockSession.messages?.map(msg => ({
        id: typeof msg.id === 'string' ? parseInt(msg.id) : msg.id,
        sessionId: typeof mockSession.id === 'string' ? parseInt(mockSession.id) : mockSession.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        userId: 1,
        createTime: msg.timestamp,
        updateTime: msg.timestamp
      })) || []
    }
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/chat/sessions', data as unknown as Record<string, unknown>)
    const apiResponse = response as unknown as {code: number, message: string, result: AiChatSession, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建AI聊天会话失败')
    }
    return apiResponse.result
  }
}

// 删除对话会话
export const deleteAiChatSession = async (ids: (string | number)[]): Promise<boolean> => {
  if (!isMockEnabled()) {
    // 使用Mock数据
    for (const id of ids.map(Number)) {
      await MockChatService.deleteChatSession(id)
    }
    return true
  } else {
    // 调用真实API
    const response = await request.delete('/api/v1/chat', {}, {
      data: ids.map(Number)
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除AI聊天会话失败')
    }
    return true
  }
}

// 流式对话
export const streamAiChat = async (
  data: StreamChatRequest,
  onMessage: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    // 调用真实API - 使用EventSource进行SSE连接
    const response = await fetch(`${getBaseURL()}/api/v1/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Stream not supported')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed === '') continue
          if (!trimmed.startsWith('data:')) continue

          const combined = trimmed.slice(5).trimStart()
          const segments = combined
            .split(/\s*data:\s*/)
            .map(s => s.trim())
            .filter(s => s.length > 0)

          for (const seg of segments) {
            if (seg === '[DONE]') {
              onComplete?.()
              return
            }

            const normalized = seg.replace(/[“”]/g, '"')
            try {
              const parsed = JSON.parse(normalized)
              if (typeof parsed.content === 'string' && parsed.content.length > 0) {
                onMessage(parsed.content)
              }
              if (parsed.finished === true) {
                onComplete?.()
                return
              }
            } catch {
              // 尝试从非标准JSON中提取content字段
              const match = normalized.match(/\"content\"\s*:\s*\"([\s\S]*?)\"/)
              if (match && match[1] && match[1].length > 0) {
                onMessage(match[1])
              }
            }
          }
        }
      }
      onComplete?.()
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    onError?.(error as Error)
    throw error
  }
}

// 智能流式对话接口（MCP模式）
export const streamIntelligentAiChat = async (
  data: StreamChatRequest,
  onMessage: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    // 调用智能流API - 使用EventSource进行SSE连接
    const response = await fetch(`${getBaseURL()}/api/v1/chat/intelligent/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (!response.body) {
      throw new Error('Stream not supported')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed === '') continue
          if (!trimmed.startsWith('data:')) continue

          // 取出 data: 之后的内容，并兼容同一行包含多个 data:
          const combined = trimmed.slice(5).trimStart()
          const segments = combined
            .split(/\s*data:\s*/)
            .map(s => s.trim())
            .filter(s => s.length > 0)

          for (const seg of segments) {
            if (seg === '[DONE]') {
              onComplete?.()
              return
            }

            const normalized = seg.replace(/[“”]/g, '"')
            try {
              const parsed = JSON.parse(normalized)
              // 兼容两种返回格式：
              // 1) { content: string, finished?: boolean }
              // 2) OpenAI风格 { choices: [{ delta: { content: string } }] }
              if (typeof parsed.content === 'string' && parsed.content.length > 0) {
                onMessage(parsed.content)
              } else if (parsed.choices && parsed.choices[0]?.delta?.content) {
                onMessage(parsed.choices[0].delta.content)
              }

              if (parsed.finished === true) {
                onComplete?.()
                return
              }
            } catch {
              // 兜底：从非标准JSON中提取content字段
              const match = normalized.match(/\"content\"\s*:\s*\"([\s\S]*?)\"/)
              if (match && match[1] && match[1].length > 0) {
                onMessage(match[1])
              }
            }
          }
        }
      }
      onComplete?.()
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    console.error('智能流式对话失败:', error)
    onError?.(error as Error)
    throw error
  }
}

export const getAiChatMessages = async (sessionId: number, params: PageParams): Promise<PageResult<AiChatMessage>> => {
  // 调用真实API
  const requestParams = {
    ...params,
    sessionId: sessionId
  }
  const response = await request.get<{result: PageResult<AiChatMessage>}>(`/api/v1/chat/message`, requestParams)
  const apiResponse = response as unknown as {code: number, message: string, result: PageResult<AiChatMessage>, success: boolean}
  if (!apiResponse || !apiResponse.result) {
    throw new Error('获取AI聊天消息列表响应数据格式错误')
  }
  return apiResponse.result
}
