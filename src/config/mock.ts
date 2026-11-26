/**
 * Mock数据配置
 * 用于控制是否使用模拟数据进行开发和测试
 */

// Mock配置接口
export interface MockConfig {
  // 是否启用Mock数据 - 设置为true时使用mock数据，false时调用真实API
  enabled: boolean
  // API延迟时间（毫秒）- 模拟网络请求延迟
  delay: number
  // 是否在控制台输出Mock日志
  log: boolean
}

// Mock配置
export const mockConfig: MockConfig = {
  // 注释：修改此字段控制是否使用Mock数据
  // true: 使用Mock数据进行开发
  // false: 调用真实后端API
  enabled: import.meta.env.VITE_USE_MOCK === 'true',
  delay: 30,
  log: true
}

// 获取Mock配置
export const getMockConfig = (): MockConfig => {
  return mockConfig
}

// 是否启用Mock
export const isMockEnabled = (): boolean => {
  return mockConfig.enabled
}

// Mock日志输出
export const mockLog = (message: string, data?: unknown): void => {
  if (mockConfig.log) {
    console.log(`[Mock] ${message}`, data || '')
  }
}

// Mock延迟函数
export const mockDelay = (ms?: number): Promise<void> => {
  const delay = ms || mockConfig.delay
  return new Promise(resolve => setTimeout(resolve, delay))
}
