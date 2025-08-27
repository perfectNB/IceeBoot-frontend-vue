/**
 * Agent管理API
 */

import { request } from '@/utils/request'
import type { Agent, PageParams, PageResult } from '@/types'
import { isMockEnabled } from '@/config/mock'
import { MockAgentService } from '@/mock/services/agent'

// 获取Agent列表
export const getAgents = async (params: PageParams): Promise<PageResult<Agent>> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockAgentService.getAgents(params)
  } else {
    // 调用真实API
    const response = await request.get<{result: PageResult<Agent>}>('/api/v1/ai/agent',  params )
    const apiResponse = response as unknown as {code: number, message: string, result: PageResult<Agent>, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取Agent列表响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 获取Agent详情
export const getAgent = async (id: string | number): Promise<Agent> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockAgentService.getAgent(id)
  } else {
    // 调用真实API
    const response = await request.get<{result: Agent}>(`/api/v1/ai/agent/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, result: Agent, success: boolean}
    if (!apiResponse || !apiResponse.result) {
      throw new Error('获取Agent详情响应数据格式错误')
    }
    return apiResponse.result
  }
}

// 创建Agent
export const createAgent = async (data: Partial<Agent>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockAgentService.createAgent(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/ai/agent', data)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('创建Agent失败')
    }
  }
}

// 更新Agent
export const updateAgent = async (id: string | number, data: Partial<Agent>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockAgentService.updateAgent(id, data)
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/ai/agent/${id}`, data)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新Agent失败')
    }
  }
}

// 删除Agent
export const deleteAgent = async (id: string | number): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockAgentService.deleteAgent(id)
  } else {
    // 调用真实API
    const response = await request.delete(`/api/v1/ai/agent/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除Agent失败')
    }
  }
}

// 更新Agent状态
export const updateAgentStatus = async (
  id: string | number,
  status: 'active' | 'inactive'
): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockAgentService.updateAgentStatus(id, status)
  } else {
    // 调用真实API
    const response = await request.put(`/api/v1/ai/agent/${id}/status`, { status })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新Agent状态失败')
    }
  }
}
