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
    return await request.get<PageResult<Agent>>('/api/v1/agents', params)
  }
}

// 获取Agent详情
export const getAgent = async (id: string | number): Promise<Agent> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockAgentService.getAgent(id)
  } else {
    // 调用真实API
    return await request.get<Agent>(`/api/v1/agent/${id}`)
  }
}

// 创建Agent
export const createAgent = async (data: Partial<Agent>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockAgentService.createAgent(data)
  } else {
    // 调用真实API
    await request.post('/api/v1/agents', data)
  }
}

// 更新Agent
export const updateAgent = async (id: string | number, data: Partial<Agent>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockAgentService.updateAgent(id, data)
  } else {
    // 调用真实API - 后端接口是PUT /api/v1/agent，ID包含在请求体中
    const requestData = { ...data, id }
    await request.put('/api/v1/agents', requestData)
  }
}

// 删除Agent（批量删除）
export const deleteAgents = async (ids: (string | number)[]): Promise<boolean> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    for (const id of ids) {
      await MockAgentService.deleteAgent(id)
    }
    return true
  } else {
    // 调用真实API
    await request.delete('/api/v1/agents', {}, {
      data: ids.map(id => typeof id === 'string' ? parseInt(id) : id)
    })
    return true
  }
}

// 删除单个Agent（兼容性保留）
export const deleteAgent = async (id: string | number): Promise<void> => {
  await deleteAgents([id])
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
    await request.put(`/api/v1/agent/${id}/status`, { status })
  }
}
