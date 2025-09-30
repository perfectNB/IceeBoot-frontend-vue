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
      },
      {
        id: 5,
        role: 'user',
        content: '这个函数的时间复杂度是多少？',
        timestamp: '2024-01-01 11:05:00'
      },
      {
        id: 6,
        role: 'assistant',
        content: '递归版本的时间复杂度是O(2^n)，因为存在大量重复计算。\n\n动态规划版本的时间复杂度是O(n)，空间复杂度是O(1)，这是更优的解决方案。\n\n对于大数值，建议使用动态规划版本以避免栈溢出和性能问题。',
        timestamp: '2024-01-01 11:05:05'
      }
    ],
    createTime: '2024-01-01 11:00:00',
    updateTime: '2024-01-01 11:05:05'
  },
  {
    id: 3,
    title: 'Gemini创意写作',
    modelId: 3,
    modelName: 'Gemini',
    messages: [
      {
        id: 7,
        role: 'user',
        content: '帮我写一首关于春天的诗',
        timestamp: '2024-01-02 09:00:00'
      },
      {
        id: 8,
        role: 'assistant',
        content: '**春日吟**\n\n柳絮飞舞满天涯，\n桃花朵朵映彩霞。\n燕子归来筑新巢，\n春风轻抚绿如茶。\n\n溪水潺潺唱欢歌，\n蝴蝶翩翩舞婆娑。\n万物复苏展生机，\n春光无限好时光。',
        timestamp: '2024-01-02 09:00:15'
      }
    ],
    createTime: '2024-01-02 09:00:00',
    updateTime: '2024-01-02 09:00:15'
  },
  {
    id: 4,
    title: 'DeepSeek技术讨论',
    modelId: 4,
    modelName: 'DeepSeek',
    messages: [
      {
        id: 9,
        role: 'user',
        content: '什么是微服务架构？有什么优缺点？',
        timestamp: '2024-01-02 14:30:00'
      },
      {
        id: 10,
        role: 'assistant',
        content: '## 微服务架构\n\n微服务架构是一种将单一应用程序开发为一套小服务的方法，每个服务运行在自己的进程中。\n\n### 优点：\n- **独立部署**：每个服务可以独立部署和扩展\n- **技术多样性**：不同服务可以使用不同技术栈\n- **故障隔离**：单个服务故障不会影响整个系统\n- **团队自治**：小团队可以独立负责特定服务\n\n### 缺点：\n- **复杂性增加**：分布式系统的复杂性\n- **网络延迟**：服务间通信开销\n- **数据一致性**：分布式事务处理困难\n- **运维成本**：需要更多的监控和管理工具',
        timestamp: '2024-01-02 14:30:20'
      }
    ],
    createTime: '2024-01-02 14:30:00',
    updateTime: '2024-01-02 14:30:20'
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