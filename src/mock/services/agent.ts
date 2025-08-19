import { mockAgents } from '../data/agent'
import type { Agent, PageParams, PageResult } from '@/types'

export class MockAgentService {
  // 获取Agent列表
  static async getAgents(params: PageParams): Promise<PageResult<Agent>> {
    const { page = 1, size = 20, name = '', type = '', platform = '' } = params
    
    let filteredAgents = [...mockAgents]
    
    // 名称搜索
    if (name && typeof name === 'string') {
      filteredAgents = filteredAgents.filter(agent => 
        agent.name.toLowerCase().includes(name.toLowerCase())
      )
    }
    
    // 类型筛选
    if (type) {
      filteredAgents = filteredAgents.filter(agent => agent.type === type)
    }
    
    // 平台筛选
    if (platform) {
      filteredAgents = filteredAgents.filter(agent => agent.platform === platform)
    }
    
    const total = filteredAgents.length
    const start = (page - 1) * size
    const end = start + size
    const records = filteredAgents.slice(start, end)
    const pages = Math.ceil(total / size)
    
    return {
      records,
      total,
      current: page,
      size,
      pages,
      hasPrevious: page > 1,
      hasNext: page < pages
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
      type: agentData.type || 'workflow',
      platform: agentData.platform || 'coze',
      remark: agentData.remark || '',
      status: agentData.status || 'active',
      // 平台特定字段
      token: agentData.token || '',
      botId: agentData.botId || '',
      workFlowId: agentData.workFlowId || '',
      // API密钥
      key: agentData.key || '',
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