/**
 * 大模型相关Mock数据
 */

import type { LLMModel } from '@/types'

// 大模型Mock数据
export const mockLLMModels: LLMModel[] = [
  {
    providerName: 'deepseek',
    displayName: 'DeepSeek',
    keys: [
      {
        id: 1,
        llmProvider: 'deepseek',
        remark: 'deepseek Api',
        secretKey: null,
        apiKey: 'sk-4****318b',
        status: 'active',
        createTime: '2025-09-04 15:23:17',
        updateTime: null
      }
    ],
    keyCount: 1,
    activeKeyCount: 1
  },
  {
    providerName: 'wenxin',
    displayName: '文心一言',
    keys: [
      {
        id: 3,
        llmProvider: 'wenxin',
        remark: '文心一言 Api',
        secretKey: 'ec4Q****Ke3B',
        apiKey: 'e0Nf****rIml',
        status: 'active',
        createTime: '2025-09-04 15:23:20',
        updateTime: null
      }
    ],
    keyCount: 1,
    activeKeyCount: 1
  },
  {
    providerName: 'qwen',
    displayName: '通义千问',
    keys: [
      {
        id: 4,
        llmProvider: 'qwen',
        remark: '通义千问 Api',
        secretKey: null,
        apiKey: 'sk-4****3a98',
        status: 'active',
        createTime: '2025-09-04 15:23:21',
        updateTime: null
      }
    ],
    keyCount: 1,
    activeKeyCount: 1
  },
  {
    providerName: 'moonshot',
    displayName: '月之暗面 (Kimi)',
    keys: [
      {
        id: 2,
        llmProvider: 'moonshot',
        remark: 'Kimi Api',
        secretKey: null,
        apiKey: 'sk-4****18b\n',
        status: 'active',
        createTime: '2025-09-04 15:23:18',
        updateTime: null
      }
    ],
    keyCount: 1,
    activeKeyCount: 1
  },
  {
    providerName: 'chatgpt',
    displayName: 'ChatGPT',
    keys: [
      {
        id: 9,
        llmProvider: 'chatgpt',
        remark: '1',
        secretKey: '',
        apiKey: 'sk-4****318b',
        status: 'active',
        createTime: '2025-09-04 16:05:57',
        updateTime: '2025-09-04 16:05:57'
      },
      {
        id: 8,
        llmProvider: 'chatgpt',
        remark: '1',
        secretKey: '',
        apiKey: 'sk-4****318b',
        status: 'active',
        createTime: '2025-09-04 16:05:08',
        updateTime: '2025-09-04 16:05:08'
      },
      {
        id: 7,
        llmProvider: 'chatgpt',
        remark: '1',
        secretKey: '',
        apiKey: 'sk-s****ddsa',
        status: 'active',
        createTime: '2025-09-04 16:04:36',
        updateTime: '2025-09-04 16:04:36'
      },
      {
        id: 6,
        llmProvider: 'chatgpt',
        remark: '1',
        secretKey: '',
        apiKey: '****',
        status: 'active',
        createTime: '2025-09-04 16:04:20',
        updateTime: '2025-09-04 16:04:20'
      }
    ],
    keyCount: 4,
    activeKeyCount: 4
  },
  {
    providerName: 'grok',
    displayName: 'Grok',
    keys: [],
    keyCount: 0,
    activeKeyCount: 0
  },
  {
    providerName: 'claude',
    displayName: 'Claude',
    keys: [],
    keyCount: 0,
    activeKeyCount: 0
  },
  {
    providerName: 'gemini',
    displayName: 'Gemini',
    keys: [],
    keyCount: 0,
    activeKeyCount: 0
  },
  {
    providerName: 'zhipu',
    displayName: '智谱AI',
    keys: [],
    keyCount: 0,
    activeKeyCount: 0
  },
  {
    providerName: 'baichuan',
    displayName: '百川智能',
    keys: [],
    keyCount: 0,
    activeKeyCount: 0
  },
  {
    providerName: 'spark',
    displayName: '讯飞星火',
    keys: [],
    keyCount: 0,
    activeKeyCount: 0
  }
]