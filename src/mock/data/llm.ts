/**
 * 大模型相关Mock数据
 */

import type { LLMModel } from '@/types'

// 大模型Mock数据
export const mockLLMModels: LLMModel[] = [
  {
    id: '1',
    name: 'DeepSeek',
    remark: 'DeepSeek AI大模型',
    description: '由深度求索开发的AI大模型，擅长代码生成和推理',
    icon: 'https://via.placeholder.com/48/4F46E5/FFFFFF?text=DS',
    keys: [
      {
        id: '1',
        key: 'ds-1234567890abcdef1234567890abcdef',
        secretKey: 'ds-secret-1234567890abcdef1234567890abcdef',
        apiKey: 'ds-api-1234567890abcdef1234567890abcdef',
        remark: 'DeepSeek主密钥',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      },
      {
        id: '2',
        key: 'ds-abcdef1234567890abcdef1234567890',
        secretKey: 'ds-secret-abcdef1234567890abcdef1234567890',
        apiKey: 'ds-api-abcdef1234567890abcdef1234567890',
        remark: 'DeepSeek备用密钥',
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
    id: '2',
    name: '文心一言',
    remark: '百度文心一言',
    description: '百度开发的大语言模型，中文理解能力强',
    icon: 'https://via.placeholder.com/48/FF6B35/FFFFFF?text=文心',
    keys: [
      {
        id: '3',
        key: 'wx-1234567890abcdef1234567890abcdef',
        secretKey: 'wx-secret-1234567890abcdef1234567890abcdef',
        apiKey: 'wx-api-1234567890abcdef1234567890abcdef',
        remark: '文心一言主密钥',
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
    id: '3',
    name: '通义千问',
    remark: '阿里通义千问',
    description: '阿里云开发的大语言模型，支持多种任务',
    icon: 'https://via.placeholder.com/48/00D4AA/FFFFFF?text=通义',
    keys: [
      {
        id: '4',
        key: 'qw-1234567890abcdef1234567890abcdef',
        secretKey: 'qw-secret-1234567890abcdef1234567890abcdef',
        apiKey: 'qw-api-1234567890abcdef1234567890abcdef',
        remark: '通义千问主密钥',
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
    id: '4',
    name: 'Kimi',
    remark: 'Moonshot Kimi',
    description: 'Moonshot AI开发的长文本理解模型',
    icon: 'https://via.placeholder.com/48/8B5CF6/FFFFFF?text=K',
    keys: [
      {
        id: '5',
        key: 'km-1234567890abcdef1234567890abcdef',
        secretKey: 'km-secret-1234567890abcdef1234567890abcdef',
        apiKey: 'km-api-1234567890abcdef1234567890abcdef',
        remark: 'Kimi主密钥',
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
    id: '5',
    name: 'ChatGPT',
    remark: 'OpenAI ChatGPT',
    description: 'OpenAI开发的对话式AI模型',
    icon: 'https://via.placeholder.com/48/10B981/FFFFFF?text=GPT',
    keys: [
      {
        id: '6',
        key: 'sk-1234567890abcdef1234567890abcdef',
        secretKey: 'sk-secret-1234567890abcdef1234567890abcdef',
        apiKey: 'sk-api-1234567890abcdef1234567890abcdef',
        remark: 'ChatGPT主密钥',
        status: 'active',
        createTime: '2024-01-01 00:00:00',
        updateTime: '2024-01-01 00:00:00'
      },
      {
        id: '7',
        key: 'sk-abcdef1234567890abcdef1234567890',
        secretKey: 'sk-secret-abcdef1234567890abcdef1234567890',
        apiKey: 'sk-api-abcdef1234567890abcdef1234567890',
        remark: 'ChatGPT备用密钥',
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
    id: '6',
    name: 'Grok',
    remark: 'xAI Grok',
    description: 'xAI开发的AI助手，具有幽默感',
    icon: 'https://via.placeholder.com/48/F59E0B/FFFFFF?text=G',
    keys: [
      {
        id: '8',
        key: 'grok-1234567890abcdef1234567890abcdef',
        secretKey: 'grok-secret-1234567890abcdef1234567890abcdef',
        apiKey: 'grok-api-1234567890abcdef1234567890abcdef',
        remark: 'Grok主密钥',
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
    id: '7',
    name: 'Claude',
    remark: 'Anthropic Claude',
    description: 'Anthropic开发的AI助手，注重安全性',
    icon: 'https://via.placeholder.com/48/EF4444/FFFFFF?text=C',
    keys: [
      {
        id: '9',
        key: 'sk-ant-api03-1234567890abcdef1234567890abcdef',
        secretKey: 'sk-ant-secret-1234567890abcdef1234567890abcdef',
        apiKey: 'sk-ant-api-1234567890abcdef1234567890abcdef',
        remark: 'Claude主密钥',
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
    id: '8',
    name: 'Gemini',
    remark: 'Google Gemini',
    description: 'Google开发的多模态AI模型',
    icon: 'https://via.placeholder.com/48/3B82F6/FFFFFF?text=G',
    keys: [
      {
        id: '10',
        key: 'gem-1234567890abcdef1234567890abcdef',
        secretKey: 'gem-secret-1234567890abcdef1234567890abcdef',
        apiKey: 'gem-api-1234567890abcdef1234567890abcdef',
        remark: 'Gemini主密钥',
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