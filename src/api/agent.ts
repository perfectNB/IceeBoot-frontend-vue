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
    const response = await request.get<{data: PageResult<Agent>}>('/api/v1/agents',  params )
    const apiResponse = response as unknown as {code: number, message: string, data: PageResult<Agent>, success: boolean}
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取Agent列表响应数据格式错误')
    }
    return apiResponse.data
  }
}

// 获取Agent详情
export const getAgent = async (id: string | number): Promise<Agent> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    return await MockAgentService.getAgent(id)
  } else {
    // 调用真实API
    const response = await request.get<{data: Agent}>(`/api/v1/agent/${id}`)
    const apiResponse = response as unknown as {code: number, message: string, data: Agent, success: boolean}
    if (!apiResponse || !apiResponse.data) {
      throw new Error('获取Agent详情响应数据格式错误')
    }
    return apiResponse.data
  }
}

// 创建Agent
export const createAgent = async (data: Partial<Agent>): Promise<void> => {
  if (isMockEnabled()) {
    // 使用Mock数据
    await MockAgentService.createAgent(data)
  } else {
    // 调用真实API
    const response = await request.post('/api/v1/agents', data)
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
    // 调用真实API - 后端接口是PUT /api/v1/agent，ID包含在请求体中
    const requestData = { ...data, id }
    const response = await request.put('/api/v1/agents', requestData)
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新Agent失败')
    }
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
    const response = await request.delete('/api/v1/agents', {}, {
      data: ids.map(id => typeof id === 'string' ? parseInt(id) : id)
    })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('删除Agent失败')
    }
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
    const response = await request.put(`/api/v1/agent/${id}/status`, { status })
    const apiResponse = response as unknown as {code: number, message: string, success: boolean}
    if (!apiResponse || !apiResponse.success) {
      throw new Error('更新Agent状态失败')
    }
  }
}
