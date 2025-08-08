/**
 * AI对话相关Mock数据
 */

import type { ChatSession } from '@/types'

// AI对话会话Mock数据
export const mockChatSessions: ChatSession[] = [
  {
    id: 1,
    title: 'ChatGPT对话会话',
    modelId: 1,
    modelName: 'ChatGPT',
    messages: [
      {
        id: 1,
        role: 'user',
        content: '你好，请介绍一下Vue.js',
        timestamp: '2024-01-01 10:00:00'
      },
      {
        id: 2,
        role: 'assistant',
        content: 'Vue.js是一个用于构建用户界面的渐进式JavaScript框架。它被设计为可以自底向上逐层应用。Vue的核心库只关注视图层，不仅易于上手，还便于与第三方库或既有项目整合。',
        timestamp: '2024-01-01 10:00:05'
      }
    ],
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:05'
  },
  {
    id: 2,
    title: 'Claude编程助手',
    modelId: 2,
    modelName: 'Claude',
    messages: [
      {
        id: 3,
        role: 'user',
        content: '帮我写一个JavaScript函数来计算斐波那契数列',
        timestamp: '2024-01-01 11:00:00'
      },
      {
        id: 4,
        role: 'assistant',
        content: '```javascript\nfunction fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n\n// 优化版本（使用动态规划）\nfunction fibonacciDP(n) {\n  if (n <= 1) return n;\n  let a = 0, b = 1;\n  for (let i = 2; i <= n; i++) {\n    [a, b] = [b, a + b];\n  }\n  return b;\n}\n```',
        timestamp: '2024-01-01 11:00:10'
      }
    ],
    createTime: '2024-01-01 11:00:00',
    updateTime: '2024-01-01 11:00:10'
  }
]

// 大模型API配置
export const llmApiConfigs = {
  'ChatGPT': {
    baseUrl: 'https://api.openai.com/v1',
    endpoint: '/chat/completions',
    model: 'gpt-3.5-turbo'
  },
  'Claude': {
    baseUrl: 'https://api.anthropic.com',
    endpoint: '/v1/messages',
    model: 'claude-3-sonnet-20240229'
  },
  '文心一言': {
    baseUrl: 'https://aip.baidubce.com',
    endpoint: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    model: 'ernie-bot'
  },
  '通义千问': {
    baseUrl: 'https://dashscope.aliyuncs.com',
    endpoint: '/api/v1/services/aigc/text-generation/generation',
    model: 'qwen-turbo'
  },
  'DeepSeek': {
    baseUrl: 'https://api.deepseek.com',
    endpoint: '/v1/chat/completions',
    model: 'deepseek-chat'
  },
  'Kimi': {
    baseUrl: 'https://api.moonshot.cn',
    endpoint: '/v1/chat/completions',
    model: 'moonshot-v1-8k'
  },
  'Grok': {
    baseUrl: 'https://api.x.ai',
    endpoint: '/v1/chat/completions',
    model: 'grok-beta'
  },
  'Gemini': {
    baseUrl: 'https://generativelanguage.googleapis.com',
    endpoint: '/v1beta/models/gemini-pro:generateContent',
    model: 'gemini-pro'
  }
}