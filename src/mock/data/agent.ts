/**
 * Agent相关Mock数据
 */

import type { Agent } from '@/types'

// Agent Mock数据
export const mockAgents: Agent[] = [
  {
    id: 1,
    name: 'Coze智能客服',
    workflowName: '客服助手工作流',
    remark: '用于处理客户咨询的智能助手',
    key: 'coze-1234567890abcdef1234567890abcdef',
    platform: 'coze',
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: 'Dify文档助手',
    workflowName: '文档问答工作流',
    remark: '基于文档内容的智能问答助手',
    key: 'dify-1234567890abcdef1234567890abcdef',
    platform: 'dify',
    status: 'active',
    createTime: '2024-01-02 00:00:00',
    updateTime: '2024-01-02 00:00:00'
  },
  {
    id: 3,
    name: 'Coze代码助手',
    workflowName: '代码生成工作流',
    remark: '帮助开发者生成和优化代码',
    key: 'coze-abcdef1234567890abcdef1234567890',
    platform: 'coze',
    status: 'active',
    createTime: '2024-01-03 00:00:00',
    updateTime: '2024-01-03 00:00:00'
  },
  {
    id: 4,
    name: 'Dify营销助手',
    workflowName: '营销文案工作流',
    remark: '生成营销文案和推广内容',
    key: 'dify-abcdef1234567890abcdef1234567890',
    platform: 'dify',
    status: 'inactive',
    createTime: '2024-01-04 00:00:00',
    updateTime: '2024-01-04 00:00:00'
  }
]