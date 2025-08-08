/**
 * Agent相关Mock数据
 */

import type { Agent } from '@/types'

// Agent Mock数据
export const mockAgents: Agent[] = [
  {
    id: 1,
    name: 'Coze智能客服',
    type: 'agent',
    remark: '用于处理客户咨询的智能助手',
    platform: 'coze',
    status: 'active',
    // 平台特定字段
    token: 'coze-token-1234567890abcdef',
    botId: 'bot_12345',
    workFlowId: 'workflow_67890',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    name: 'Dify文档助手',
    type: 'workflow',
    remark: '基于文档内容的智能问答助手',
    platform: 'dify',
    status: 'active',
    // API密钥
    key: 'dify-1234567890abcdef1234567890abcdef',
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    name: 'Coze代码助手',
    type: 'agent',
    remark: '帮助开发者生成和优化代码',
    platform: 'coze',
    status: 'active',
    // 平台特定字段
    token: 'coze-token-abcdef1234567890',
    botId: 'bot_54321',
    workFlowId: 'workflow_09876',
    createTime: '2024-01-03 00:00:00',
    updateTime: '2024-01-17 09:15:00'
  },
  {
    id: 4,
    name: 'Dify营销助手',
    type: 'workflow',
    remark: '生成营销文案和推广内容',
    platform: 'dify',
    status: 'inactive',
    // API密钥
    key: 'dify-abcdef1234567890abcdef1234567890',
    createTime: '2024-01-04 00:00:00',
    updateTime: '2024-01-18 16:45:00'
  }
]