import { mockAgents } from '../data/agent'
import type { Agent, PageParams, PageResult } from '@/types'

export class MockAgentService {
  // 获取Agent列表
  static async getAgents(params: PageParams): Promise<PageResult<Agent>> {
    const { page = 1, size = 20, keyword = '' } = params
    
    let filteredAgents = [...mockAgents]
    
    // 关键词搜索
    if (keyword) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.name.toLowerCase().includes(keyword.toLowerCase()) ||
        agent.workflowName.toLowerCase().includes(keyword.toLowerCase()) ||
        agent.remark.toLowerCase().includes(keyword.toLowerCase())
      )
    }
    
    const total = filteredAgents.length
    const start = (page - 1) * size
    const end = start + size
    const list = filteredAgents.slice(start, end)
    
    return {
      list,
      total,
      page,
      size,
      pages: Math.ceil(total / size)
    }
  }

  // 获取Agent详情
  static async getAgent(id: string | number): Promise<Agent> {
    const agent = mockAgents.find(a => a.id === id)
    
    if (!agent) {
      throw new Error(`Agent "${id}" 不存在`)
    }
    
    return { ...agent }
  }

  // 创建Agent
  static async createAgent(agentData: Partial<Agent>): Promise<Agent> {
    const newAgent: Agent = {
      id: Date.now(),
      name: agentData.name || '',
      workflowName: agentData.workflowName || '',
      platform: agentData.platform || 'coze',
      remark: agentData.remark || '',
      key: agentData.key || '',
      status: agentData.status || 'active',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    mockAgents.push(newAgent)
    
    return { ...newAgent }
  }

  // 更新Agent
  static async updateAgent(id: string | number, agentData: Partial<Agent>): Promise<Agent> {
    const index = mockAgents.findIndex(a => a.id === id)
    
    if (index === -1) {
      throw new Error(`Agent "${id}" 不存在`)
    }
    
    const updatedAgent = {
      ...mockAgents[index],
      ...agentData,
      id,
      updateTime: new Date().toISOString()
    }
    
    mockAgents[index] = updatedAgent
    return { ...updatedAgent }
  }

  // 删除Agent
  static async deleteAgent(id: string | number): Promise<void> {
    const index = mockAgents.findIndex(a => a.id === id)
    
    if (index === -1) {
      throw new Error(`Agent "${id}" 不存在`)
    }
    
    mockAgents.splice(index, 1)
  }

  // 更新Agent状态
  static async updateAgentStatus(id: string | number, status: 'active' | 'inactive'): Promise<Agent> {
    const agent = mockAgents.find(a => a.id === id)
    
    if (!agent) {
      throw new Error(`Agent "${id}" 不存在`)
    }
    
    agent.status = status
    agent.updateTime = new Date().toISOString()
    
    return { ...agent }
  }
}