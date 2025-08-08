/**
 * Agent管理API
 */

import { request } from '@/utils/request'
import type { Agent, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockAgentService } from '@/mock/services/agent'

/**
 * 获取Agent列表
 */
export const getAgents = async (params: PageParams): Promise<PageResult<Agent>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockAgentService.getAgents(params)
    return response.data
  } else {
    // 调用真实API
    const response = await request.get<PageResult<Agent>>('/api/v1/ai/agent', params)
    return response.data
  }
}

/**
 * 获取Agent详情
 */
export const getAgent = async (id: string | number): Promise<Agent> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockAgentService.getAgent(id)
    return response.data
  } else {
    // 调用真实API
    const response = await request.get<Agent>(`/api/v1/ai/agent/${id}`)
    return response.data
  }
}

/**
 * 创建Agent
 */
export const createAgent = async (data: Partial<Agent>): Promise<Agent> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockAgentService.createAgent(data)
    return response.data
  } else {
    // 调用真实API
    const response = await request.post<Agent>('/api/v1/ai/agent', data)
    return response.data
  }
}

/**
 * 更新Agent
 */
export const updateAgent = async (id: string | number, data: Partial<Agent>): Promise<Agent> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockAgentService.updateAgent(id, data)
    return response.data
  } else {
    // 调用真实API
    const response = await request.put<Agent>(`/api/v1/ai/agent/${id}`, data)
    return response.data
  }
}

/**
 * 删除Agent
 */
export const deleteAgent = async (id: string | number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockAgentService.deleteAgent(id)
  } else {
    // 调用真实API
    await request.delete(`/api/v1/ai/agent/${id}`)
  }
}

/**
 * 更新Agent状态
 */
export const updateAgentStatus = async (id: string | number, status: 'active' | 'inactive'): Promise<Agent> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    const response = await MockAgentService.updateAgentStatus(id, status)
    return response.data
  } else {
    // 调用真实API
    const response = await request.put<Agent>(`/api/v1/ai/agent/${id}/status`, { status })
    return response.data
  }
}