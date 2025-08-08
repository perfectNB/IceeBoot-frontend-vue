/**
 * 大模型相关Mock数据
 */

import type { LLMModel } from '@/types'

// 大模型Mock数据
export const mockLLMModels: LLMModel[] = [
  {
    id: 1,
    name: 'ChatGPT',
    remark: 'OpenAI的GPT模型',
    keys: [
      {
        id: 1,
        key: 'sk-1234567890abcdef1234567890abcdef',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      },
      {
        id: 2,
        key: 'sk-abcdef1234567890abcdef1234567890',
        status: 'active',
        createTime: '2024-01-02 00:00:00',
        updateTime: '2024-01-02 00:00:00'
      }
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: 'Claude',
    remark: 'Anthropic的Claude模型',
    keys: [
      {
        id: 3,
        key: 'sk-ant-api03-1234567890abcdef1234567890abcdef',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      }
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 3,
    name: '文心一言',
    remark: '百度的文心一言模型',
    keys: [
      {
        id: 4,
        key: 'wx-1234567890abcdef1234567890abcdef',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      }
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 4,
    name: '通义千问',
    remark: '阿里巴巴的通义千问模型',
    keys: [
      {
        id: 5,
        key: 'qw-1234567890abcdef1234567890abcdef',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      }
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 5,
    name: 'DeepSeek',
    remark: 'DeepSeek的AI模型',
    keys: [
      {
        id: 6,
        key: 'ds-1234567890abcdef1234567890abcdef',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      }
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 6,
    name: 'Kimi',
    remark: 'Moonshot AI的Kimi模型',
    keys: [
      {
        id: 7,
        key: 'km-1234567890abcdef1234567890abcdef',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      }
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 7,
    name: 'Grok',
    remark: 'xAI的Grok模型',
    keys: [
      {
        id: 8,
        key: 'grok-1234567890abcdef1234567890abcdef',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      }
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  },
  {
    id: 8,
    name: 'Gemini',
    remark: 'Google的Gemini模型',
    keys: [
      {
        id: 9,
        key: 'gem-1234567890abcdef1234567890abcdef',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      }
    ],
    status: 'active',
    createTime: '2024-01-01 00:00:00',
    updateTime: '2024-01-01 00:00:00'
  }
]